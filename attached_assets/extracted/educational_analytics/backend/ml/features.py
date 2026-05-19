import pandas as pd

def build_features(grades, attendance):
    df = pd.merge(grades, attendance, on="student_id")
    df['performance_index'] = (
        0.7 * df['score'] + 0.3 * df['percentage']
    )
    return df