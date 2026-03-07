import math
from typing import Dict, List
from security import schemas

def extract_features(data: schemas.BehavioralData) -> Dict[str, float]:
    """
    Extracts high-level features from raw mouse and click data.
    """
    points = data.mouse_points
    clicks = data.clicks
    scrolls = data.scrolls
    time_elapsed = data.time_elapsed

    if not points or len(points) < 2:
        return {
            "avg_speed": 0.0,
            "avg_acceleration": 0.0,
            "jitter_variance": 0.0,
            "click_interval_avg": 0.0,
            "scroll_speed_avg": 0.0
        }

    total_dist = 0.0
    speeds: List[float] = []
    accelerations: List[float] = []
    
    for i in range(1, len(points)):
        p1, p2 = points[i-1], points[i]
        dx = p2.x - p1.x
        dy = p2.y - p1.y
        dist = math.sqrt(dx**2 + dy**2)
        total_dist += dist
        
        dt = p2.timestamp - p1.timestamp
        if dt > 0:
            speed = dist / dt
            speeds.append(speed)
            if len(speeds) > 1:
                acc = (speeds[-1] - speeds[-2]) / dt
                accelerations.append(abs(acc))
                
    avg_speed = sum(speeds) / len(speeds) if speeds else 0.0
    avg_acceleration = sum(accelerations) / len(accelerations) if accelerations else 0.0
    
    # Simple jitter: how much it deviates from a straight line over short windows
    # Since this is a simple implementation, we'll estimate jitter as direction changes
    jitter_variance = 0.0
    if len(points) > 2:
        angles: List[float] = []
        for i in range(2, len(points)):
            dx1 = points[i-1].x - points[i-2].x
            dy1 = points[i-1].y - points[i-2].y
            dx2 = points[i].x - points[i-1].x
            dy2 = points[i].y - points[i-1].y
            
            # Dot product / magnitudes
            mag1 = math.sqrt(dx1**2 + dy1**2)
            mag2 = math.sqrt(dx2**2 + dy2**2)
            if mag1 > 0 and mag2 > 0:
                dot = dx1*dx2 + dy1*dy2
                cos_theta = max(-1.0, min(1.0, dot / (mag1 * mag2)))
                angle = math.acos(cos_theta)
                angles.append(angle)
        
        if angles:
            avg_angle = sum(angles) / len(angles)
            jitter_variance = sum((a - avg_angle)**2 for a in angles) / len(angles)

    click_intervals: List[float] = []
    for i in range(1, len(clicks)):
        click_intervals.append(clicks[i].timestamp - clicks[i-1].timestamp)
    click_interval_avg = sum(click_intervals) / len(click_intervals) if click_intervals else 0.0

    scroll_speed_avg = 0.0
    if scrolls and time_elapsed > 0:
        total_scroll = sum(abs(s.amount) for s in scrolls)
        scroll_speed_avg = total_scroll / time_elapsed

    return {
        "avg_speed": avg_speed,
        "avg_acceleration": avg_acceleration,
        "jitter_variance": jitter_variance,
        "click_interval_avg": click_interval_avg,
        "scroll_speed_avg": scroll_speed_avg
    }

def is_bot(data: schemas.BehavioralData, features: Dict[str, float]) -> bool:
    """
    Anti-bot heuristic checks.
    """
    points = data.mouse_points
    # 1. Very fast completion with no mouse points
    if data.time_elapsed < 200 and len(points) < 5:
        return True
    
    # 2. Perfectly uniform speed (no acceleration)
    if features["avg_speed"] > 0 and features["avg_acceleration"] == 0:
        return True
    
    # 3. Too many straight lines (zero jitter) over a lot of points
    if len(points) > 20 and features["jitter_variance"] < 0.0001:
        return True

    return False

def compare_profiles(live: Dict[str, float], baseline: Dict[str, float]) -> float:
    """
    Compares live features to baseline, returns a score from 0.0 to 100.0.
    """
    def calc_similarity(val1, val2, tolerance=0.2):
        if val1 == 0 and val2 == 0: return 1.0
        if val1 == 0 or val2 == 0: return 0.5
        diff = abs(val1 - val2)
        max_val = max(abs(val1), abs(val2))
        ratio = diff / max_val
        # if ratio > tolerance, score decreases
        score = max(0.0, 1.0 - (ratio / (tolerance * 5))) # e.g. if diff is huge, score approaches 0
        return score
        
    s_speed = calc_similarity(live["avg_speed"], baseline["avg_speed"], 0.4)
    s_accel = calc_similarity(live["avg_acceleration"], baseline["avg_acceleration"], 0.5)
    s_jitter = calc_similarity(live["jitter_variance"], baseline["jitter_variance"], 0.5)
    
    # Weighted average
    total_score = (s_speed * 0.4 + s_accel * 0.4 + s_jitter * 0.2) * 100
    return total_score
