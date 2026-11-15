# Typing FreeX Metrics Specification (§3.5)

## 1. Speed Metrics

### Net Words Per Minute (WPM)
Standard typing test metric normalized to 5 characters per word:
$$\text{WPM} = \frac{\text{Correct Characters} / 5}{\text{Elapsed Seconds} / 60}$$

### Raw Words Per Minute (Raw WPM)
Includes all keystrokes typed, whether correct or incorrect:
$$\text{Raw WPM} = \frac{\text{Total Characters Typed} / 5}{\text{Elapsed Seconds} / 60}$$

### Unit Conversions
- $\text{CPM (Characters Per Minute)} = \text{WPM} \times 5$
- $\text{KPH (Keystrokes Per Hour)} = \text{CPM} \times 60 = \text{WPM} \times 300$

## 2. Accuracy Metric
$$\text{Accuracy} = \frac{\text{Correct Characters}}{\text{Total Typed Characters}} \times 100\%$$
If no characters have been typed, accuracy defaults to 100.0%.

## 3. Consistency Metric
Calculated from the series of instantaneous WPM values sampled at 1-second intervals:
$$\mu = \frac{1}{N}\sum_{i=1}^N \text{WPM}_i$$
$$\sigma = \sqrt{\frac{1}{N}\sum_{i=1}^N (\text{WPM}_i - \mu)^2}$$
$$\text{CV} = \frac{\sigma}{\mu}$$
$$\text{Consistency} = \max(0, \min(100, (1 - \text{CV}) \times 100\%))$$
When fewer than 2 intervals exist, consistency is 100.0%.
