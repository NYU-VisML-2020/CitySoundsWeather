import argparse
import pandas as pd
import time

def get_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('data_loc')
    parser.add_argument('target_loc')

    return parser.parse_args()

def clean_precip_col(df):
    precip_col = df['p01m']
    
    # Replace trace values, T, with 0.00
    precip_t_count = precip_col[precip_col == 'T'].count()
    if precip_t_count > 0:
        print(f"{precip_t_count} trace values in 'p01m' column")
        df.replace({'p01m': {'T': 0.00}}, inplace=True)
        
    # Replace missing values, M, with 0.00
    precip_m_count = precip_col[precip_col == 'M'].count()
    if precip_m_count > 0:
        print(f"{precip_m_count} missing values in 'p01m' column")
        df.replace({'p01m': {'M': 0.00}}, inplace=True)

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