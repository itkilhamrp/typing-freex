pub const MAX_PARTS: usize = 200;
pub const MAX_CHARS_PER_PART: usize = 50_000;

#[derive(Debug, Clone)]
pub struct TextPart {
    pub index: usize,
    pub title: String,
    pub body: String,
    pub word_count: usize,
    pub char_count: usize,
}

fn chunk_by_char_limit(text: &str, max_chars: usize) -> Vec<String> {
    let mut chunks = Vec::new();
    let mut remaining = text.trim();
    while !remaining.is_empty() {
        let total = remaining.chars().count();
        if total <= max_chars {
            chunks.push(remaining.to_string());
            break;
        }

        // Find byte offset of max_chars
        let cut_byte = remaining
            .char_indices()
            .nth(max_chars)
            .map(|(idx, _)| idx)
            .unwrap_or(remaining.len());

        let window = &remaining[..cut_byte];
        let split_at = window
            .rfind('\n')
            .or_else(|| window.rfind(char::is_whitespace))
            .filter(|&pos| pos > 0)
            .unwrap_or(cut_byte);

        let piece = remaining[..split_at].trim();
        if !piece.is_empty() {
            chunks.push(piece.to_string());
        }
        remaining = remaining[split_at..].trim_start();
    }
    chunks
}

pub fn split_text(
    base_title: &str,
    text: &str,
    strategy: &str,
    target_chars: Option<usize>,
) -> Vec<TextPart> {
    let target = target_chars.unwrap_or(5_000).clamp(10, MAX_CHARS_PER_PART);
    let total_chars = text.chars().count();

    if (strategy == "none" && total_chars <= MAX_CHARS_PER_PART) || total_chars <= target {
        let word_count = text.split_whitespace().count();
        return vec![TextPart {
            index: 1,
            title: base_title.to_string(),
            body: text.to_string(),
            word_count,
            char_count: total_chars,
        }];
    }

    let effective_target = if strategy == "none" {
        MAX_CHARS_PER_PART
    } else {
        target
    };

    let mut segments: Vec<String> = Vec::new();
    for p in text.split("\n\n") {
        let p_trimmed = p.trim();
        if p_trimmed.is_empty() {
            continue;
        }
        if p_trimmed.chars().count() > effective_target {
            segments.extend(chunk_by_char_limit(p_trimmed, effective_target));
        } else {
            segments.push(p_trimmed.to_string());
        }
    }

    let mut raw_bodies: Vec<String> = Vec::new();
    let mut current_body = String::new();

    for seg in segments {
        let seg_chars = seg.chars().count();
        let cur_chars = current_body.chars().count();

        if !current_body.is_empty() && (cur_chars + seg_chars + 2 > effective_target) {
            raw_bodies.push(std::mem::take(&mut current_body));
            if raw_bodies.len() >= MAX_PARTS {
                break;
            }
        }

        if !current_body.is_empty() {
            current_body.push_str("\n\n");
        }
        current_body.push_str(&seg);
    }

    if !current_body.is_empty() && raw_bodies.len() < MAX_PARTS {
        raw_bodies.push(current_body);
    }

    let total_parts = raw_bodies.len();
    raw_bodies
        .into_iter()
        .enumerate()
        .map(|(i, body)| {
            let idx = i + 1;
            let char_count = body.chars().count();
            let word_count = body.split_whitespace().count();
            let title = if total_parts == 1 {
                base_title.to_string()
            } else {
                format!("{} (part {})", base_title, idx)
            };
            TextPart {
                index: idx,
                title,
                body,
                word_count,
                char_count,
            }
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_split_by_paragraph() {
        let p1 = "First paragraph here with some text.";
        let p2 = "Second paragraph here with some text.";
        let combined = format!("{}\n\n{}", p1, p2);

        let parts = split_text("Story", &combined, "paragraph", Some(40));
        assert_eq!(parts.len(), 2);
        assert_eq!(parts[0].title, "Story (part 1)");
        assert_eq!(parts[1].title, "Story (part 2)");
    }
}
