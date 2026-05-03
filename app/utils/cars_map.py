from pathlib import Path
import pandas as pd


def load_vehicle_data(csv_path: Path | str | None = None) -> pd.DataFrame:
    if csv_path is None:
        csv_path = Path(__file__).resolve().parents[2] / "data" / "pakistan_vehicle_listings.csv"
    return pd.read_csv(csv_path)


def get_car_make_model_summary(df: pd.DataFrame) -> tuple[int, list[str], list[str], list[tuple[str, str]]]:
    car_df = df[df["category"].str.lower() == "car"] if "category" in df.columns else df
    make_model_pairs = car_df[["make", "model"]].dropna().drop_duplicates()
    unique_makes = sorted(make_model_pairs["make"].unique().tolist())
    unique_models = sorted(make_model_pairs["model"].unique().tolist())
    pairs = [tuple(row) for row in make_model_pairs.sort_values(["make", "model"]).to_numpy()]
    return len(pairs), unique_makes, unique_models, pairs


def print_car_summary(csv_path: Path | str | None = None) -> None:
    df = load_vehicle_data(csv_path)
    total_pairs, makes, models, pairs = get_car_make_model_summary(df)

    print(f"Unique car make/model pairs: {total_pairs}")
    print(f"Unique car makes: {len(makes)}")
    print(f"Unique car models: {len(models)}")
    print("\nCar makes:")
    print(", ".join(makes))
    print("\nCar models:")
    print(", ".join(models))
    print("\nMake/model pairs:")
    for make, model in pairs:
        print(f"{make} - {model}")


if __name__ == "__main__":
    print_car_summary()
