import argparse
import pandas as pd
import statistics
import time


def get_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('data_loc')
    parser.add_argument('target_loc')

    return parser.parse_args()


def clean_precip_col(df):
    precip_col = df['p01m']

    # Replace trace values, T, with 0.00 in 'p01m' column
    precip_t_count = precip_col[precip_col == 'T'].count()
    if precip_t_count > 0:
        print(f"{precip_t_count} trace values in 'p01m' column")
        df.replace({'p01m': {'T': 0.00}}, inplace=True)

    precip_instances = precip_col[precip_col != 'M'].index
    if precip_instances[0] != 0:
        df.loc[0:precip_instances[0], 'p01m'] = precip_col[precip_instances[0]]

    # possibly improvement: rather than abrupt change, linearly extrapolate
    for i in range(len(precip_instances)-1):
        beg = precip_instances[i]+1
        end = precip_instances[i+1]

        init_val = float(precip_col.at[beg-1])
        final_val = float(precip_col.at[end])

        if init_val == final_val:
            # if initial and final value same, just replace M with either
            df.loc[beg:end, 'p01m'] = init_val
        else:
            total_interval = end - beg

            if total_interval == 0:
                continue

            if total_interval % 2 == 0:
                mid = beg + total_interval/2
                df.loc[beg:mid, 'p01m'] = init_val
                df.loc[mid:end, 'p01m'] = final_val
            else:
                mid = statistics.median(range(beg, end))
                mid_val = statistics.median([init_val, final_val])
                df.loc[mid, 'p01m'] = mid_val
                if total_interval > 1:
                    df.loc[beg:mid, 'p01m'] = init_val
                    df.loc[mid+1:end, 'p01m'] = final_val

    # Take care of remaining missing values, if any
    last_index = precip_instances[-1]
    if last_index < len(precip_col):
        last_val = float(precip_col.at[last_index])
        df.loc[last_index+1:, 'p01m'] = last_val


def change_col_names(df):
    df.rename(
        columns={
            'valid': 'datetime[utc]',
            'sknt': 'windspeed[knots]',
            'p01m': 'precipitation[mm]'
        },
        inplace=True
    )


def main():
    start = time.time()
    args = get_args()

    df = pd.read_csv(args.data_loc, parse_dates=['valid'])

    clean_precip_col(df)
    change_col_names(df)

    df.to_csv(args.target_loc, index=False)
    end = time.time()
    print(f'This script took {end - start:.2f} seconds to complete')


if __name__ == '__main__':
    main()
