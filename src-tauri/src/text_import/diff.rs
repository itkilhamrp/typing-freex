use serde::{Deserialize, Serialize};
use crate::error::{AppError, AppResult};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum DiffTag {
    Equal,
    Insert,
    Delete,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct DiffLine {
    pub tag: DiffTag,
    pub old_line_num: Option<usize>,
    pub new_line_num: Option<usize>,
    pub text: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default, Serialize, Deserialize)]
pub struct DiffStats {
    pub additions: usize,
    pub deletions: usize,
    pub equal: usize,
}

/// Computes a line-by-line difference between old_text and new_text using
/// optimized prefix/suffix trimming and Longest Common Subsequence (LCS).
pub fn compute_line_diff(old_text: &str, new_text: &str) -> (Vec<DiffLine>, DiffStats) {
    let old_lines: Vec<&str> = if old_text.is_empty() {
        Vec::new()
    } else {
        old_text.split('\n').collect()
    };

    let new_lines: Vec<&str> = if new_text.is_empty() {
        Vec::new()
    } else {
        new_text.split('\n').collect()
    };

    let old_len = old_lines.len();
    let new_len = new_lines.len();

    // 1. Trim common prefix
    let mut prefix_len = 0;
    while prefix_len < old_len && prefix_len < new_len && old_lines[prefix_len] == new_lines[prefix_len] {
        prefix_len += 1;
    }

    // 2. Trim common suffix
    let mut suffix_len = 0;
    while suffix_len < (old_len - prefix_len)
        && suffix_len < (new_len - prefix_len)
        && old_lines[old_len - 1 - suffix_len] == new_lines[new_len - 1 - suffix_len]
    {
        suffix_len += 1;
    }

    let mid_old_start = prefix_len;
    let mid_old_end = old_len - suffix_len;
    let mid_new_start = prefix_len;
    let mid_new_end = new_len - suffix_len;

    let mid_old = &old_lines[mid_old_start..mid_old_end];
    let mid_new = &new_lines[mid_new_start..mid_new_end];

    // 3. Compute LCS on middle section using dynamic programming (with O(m*n) cell cap to prevent OOM)
    let m = mid_old.len();
    let n = mid_new.len();

    let mut mid_diff = Vec::new();
    if (m as u64).saturating_mul(n as u64) > 4_000_000 {
        for &old_line in mid_old {
            mid_diff.push((DiffTag::Delete, old_line));
        }
        for &new_line in mid_new {
            mid_diff.push((DiffTag::Insert, new_line));
        }
    } else {
        let mut dp = vec![vec![0u32; n + 1]; m + 1];
        for i in 0..m {
            for j in 0..n {
                if mid_old[i] == mid_new[j] {
                    dp[i + 1][j + 1] = dp[i][j] + 1;
                } else {
                    dp[i + 1][j + 1] = dp[i + 1][j].max(dp[i][j + 1]);
                }
            }
        }

        // Backtrack to find diff operations for the middle section
        let mut i = m;
        let mut j = n;

        while i > 0 || j > 0 {
            if i > 0 && j > 0 && mid_old[i - 1] == mid_new[j - 1] {
                mid_diff.push((DiffTag::Equal, mid_old[i - 1]));
                i -= 1;
                j -= 1;
            } else if j > 0 && (i == 0 || dp[i][j - 1] >= dp[i - 1][j]) {
                mid_diff.push((DiffTag::Insert, mid_new[j - 1]));
                j -= 1;
            } else if i > 0 && (j == 0 || dp[i][j - 1] < dp[i - 1][j]) {
                mid_diff.push((DiffTag::Delete, mid_old[i - 1]));
                i -= 1;
            }
        }
        mid_diff.reverse();
    }

    // 4. Assemble complete diff lines with line numbers
    let mut diff_lines = Vec::with_capacity(old_len + new_len);
    let mut stats = DiffStats::default();

    let mut old_line_idx = 1;
    let mut new_line_idx = 1;

    // Add prefix
    for line in &old_lines[..prefix_len] {
        diff_lines.push(DiffLine {
            tag: DiffTag::Equal,
            old_line_num: Some(old_line_idx),
            new_line_num: Some(new_line_idx),
            text: (*line).to_string(),
        });
        old_line_idx += 1;
        new_line_idx += 1;
        stats.equal += 1;
    }

    // Add middle
    for (tag, text) in mid_diff {
        match tag {
            DiffTag::Equal => {
                diff_lines.push(DiffLine {
                    tag: DiffTag::Equal,
                    old_line_num: Some(old_line_idx),
                    new_line_num: Some(new_line_idx),
                    text: text.to_string(),
                });
                old_line_idx += 1;
                new_line_idx += 1;
                stats.equal += 1;
            }
            DiffTag::Insert => {
                diff_lines.push(DiffLine {
                    tag: DiffTag::Insert,
                    old_line_num: None,
                    new_line_num: Some(new_line_idx),
                    text: text.to_string(),
                });
                new_line_idx += 1;
                stats.additions += 1;
            }
            DiffTag::Delete => {
                diff_lines.push(DiffLine {
                    tag: DiffTag::Delete,
                    old_line_num: Some(old_line_idx),
                    new_line_num: None,
                    text: text.to_string(),
                });
                old_line_idx += 1;
                stats.deletions += 1;
            }
        }
    }

    // Add suffix
    for line in &old_lines[mid_old_end..] {
        diff_lines.push(DiffLine {
            tag: DiffTag::Equal,
            old_line_num: Some(old_line_idx),
            new_line_num: Some(new_line_idx),
            text: (*line).to_string(),
        });
        old_line_idx += 1;
        new_line_idx += 1;
        stats.equal += 1;
    }

    (diff_lines, stats)
}

/// Generates an ultra-compact delta format for storage in database.
/// Format:
/// - `=N`: N unchanged lines
/// - `+text`: inserted line
/// - `-text`: deleted line
pub fn create_compact_delta(old_text: &str, new_text: &str) -> (String, DiffStats) {
    let (diff_lines, stats) = compute_line_diff(old_text, new_text);
    let mut out = String::new();
    let mut equal_run = 0usize;

    for line in diff_lines {
        match line.tag {
            DiffTag::Equal => {
                equal_run += 1;
            }
            DiffTag::Insert => {
                if equal_run > 0 {
                    out.push_str(&format!("={}\n", equal_run));
                    equal_run = 0;
                }
                out.push('+');
                out.push_str(&line.text);
                out.push('\n');
            }
            DiffTag::Delete => {
                if equal_run > 0 {
                    out.push_str(&format!("={}\n", equal_run));
                    equal_run = 0;
                }
                out.push('-');
                out.push_str(&line.text);
                out.push('\n');
            }
        }
    }

    if equal_run > 0 {
        out.push_str(&format!("={}\n", equal_run));
    }

    (out, stats)
}

/// Reconstructs new_text from old_text and compact_delta with 100% byte integrity.
pub fn apply_compact_delta(old_text: &str, delta: &str) -> AppResult<String> {
    let old_lines: Vec<&str> = if old_text.is_empty() {
        Vec::new()
    } else {
        old_text.split('\n').collect()
    };

    let mut old_idx = 0;
    let mut result_lines = Vec::new();

    for line in delta.lines() {
        if line.is_empty() {
            continue;
        }

        let prefix = line.chars().next().unwrap_or(' ');
        let content = &line[prefix.len_utf8()..];

        match prefix {
            '=' => {
                let count: usize = content
                    .parse()
                    .map_err(|e| AppError::Validation(format!("Invalid delta count: {}", e)))?;
                for _ in 0..count {
                    if old_idx < old_lines.len() {
                        result_lines.push(old_lines[old_idx].to_string());
                        old_idx += 1;
                    } else {
                        return Err(AppError::Validation(
                            "Delta equal count exceeds old text lines".to_string(),
                        ));
                    }
                }
            }
            '+' => {
                result_lines.push(content.to_string());
            }
            '-' => {
                if old_idx < old_lines.len() {
                    // Skip old line (it was deleted)
                    old_idx += 1;
                }
            }
            _ => {
                return Err(AppError::Validation(format!("Invalid delta opcode: {}", prefix)));
            }
        }
    }

    // Append any trailing remaining old lines if delta ended early
    while old_idx < old_lines.len() {
        result_lines.push(old_lines[old_idx].to_string());
        old_idx += 1;
    }

    Ok(result_lines.join("\n"))
}

/// Generates standard Git-style unified diff representation for display/export.
pub fn format_git_unified_diff(
    title: &str,
    old_rev: u32,
    new_rev: u32,
    diff_lines: &[DiffLine],
) -> String {
    let mut buf = String::new();
    buf.push_str(&format!("--- a/{} (rev {})\n", title, old_rev));
    buf.push_str(&format!("+++ b/{} (rev {})\n", title, new_rev));

    for line in diff_lines {
        match line.tag {
            DiffTag::Equal => {
                buf.push(' ');
                buf.push_str(&line.text);
                buf.push('\n');
            }
            DiffTag::Insert => {
                buf.push('+');
                buf.push_str(&line.text);
                buf.push('\n');
            }
            DiffTag::Delete => {
                buf.push('-');
                buf.push_str(&line.text);
                buf.push('\n');
            }
        }
    }

    buf
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_identical_texts_diff() {
        let text = "Line 1\nLine 2\nLine 3";
        let (lines, stats) = compute_line_diff(text, text);
        assert_eq!(stats.additions, 0);
        assert_eq!(stats.deletions, 0);
        assert_eq!(stats.equal, 3);
        assert_eq!(lines.len(), 3);
        assert!(lines.iter().all(|l| l.tag == DiffTag::Equal));
    }

    #[test]
    fn test_delta_roundtrip_modification() {
        let old_text = "The quick brown fox\njumps over\nthe lazy dog";
        let new_text = "The quick brown fox\nleaps over\nthe sleepy dog\nand rests";

        let (delta, stats) = create_compact_delta(old_text, new_text);
        assert_eq!(stats.additions, 3);
        assert_eq!(stats.deletions, 2);
        assert_eq!(stats.equal, 1);

        let reconstructed = apply_compact_delta(old_text, &delta).unwrap();
        assert_eq!(reconstructed, new_text);
    }

    #[test]
    fn test_delta_roundtrip_empty_to_content() {
        let old_text = "";
        let new_text = "First paragraph.\n\nSecond paragraph.";

        let (delta, stats) = create_compact_delta(old_text, new_text);
        assert_eq!(stats.additions, 3);
        assert_eq!(stats.deletions, 0);

        let reconstructed = apply_compact_delta(old_text, &delta).unwrap();
        assert_eq!(reconstructed, new_text);
    }

    #[test]
    fn test_delta_roundtrip_content_to_empty() {
        let old_text = "Line 1\nLine 2";
        let new_text = "";

        let (delta, stats) = create_compact_delta(old_text, new_text);
        assert_eq!(stats.additions, 0);
        assert_eq!(stats.deletions, 2);

        let reconstructed = apply_compact_delta(old_text, &delta).unwrap();
        assert_eq!(reconstructed, new_text);
    }

    #[test]
    fn test_git_unified_diff_formatting() {
        let old_text = "Apple\nBanana";
        let new_text = "Apple\nBlueberry";

        let (lines, _) = compute_line_diff(old_text, new_text);
        let git_diff = format_git_unified_diff("Fruit", 1, 2, &lines);

        assert!(git_diff.contains("--- a/Fruit (rev 1)"));
        assert!(git_diff.contains("+++ b/Fruit (rev 2)"));
        assert!(git_diff.contains(" Apple\n"));
        assert!(git_diff.contains("-Banana\n"));
        assert!(git_diff.contains("+Blueberry\n"));
    }
}
