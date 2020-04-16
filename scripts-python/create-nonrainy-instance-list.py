import random
import time

from concurrent import futures

import h5py
import numpy as np
import pandas as pd

random.seed(5176679560041666191) # I hashed 'hedgehog' and this number came up

def convert_to_epoch(stamp):
    return (stamp - pd.Timestamp('1970-01-01')) // pd.Timedelta('1s')

def read_index_file(node):
    start_t = time.time()
    index_path = f'../sonyc/indices/2017/{node}_recording_index.h5'
    f = h5py.File(index_path, 'r')['recording_index']['timestamp', 'day_hdf5_path', 'day_h5_index']
    end_t = time.time()
    delta_t = end_t - start_t
    print(f'{delta_t:>6.2f} seconds taken to load {node}')
    return node, f

def get_argmin(node_timestamps, rain_timestamp):
    '''Return index of closest occurence of sound recording.'''
    return np.argmin(abs(node_timestamps - rain_timestamp))

def match_closest_instances(node_indices, rain_df):
    return {
        node: tuple(
            (get_argmin(indices['timestamp'], rain_ts), i) for i, rain_ts in rain_df['datetime[epoch]'].iteritems()
        ) for node, indices in node_indices.items()
    }

def create_df(node_indices, rain_df, closest_instances):
    skeleton = []
    for node, indices in node_indices.items():
        instance_indices = closest_instances[node] # (node_indices index, rain_df index) tuple
        for node_index, rain_index in instance_indices:
            node_ts, path, index = indices[node_index]
            _, rain_ts, precip = rain_df.iloc[rain_index]
            skeleton.append((node_ts, rain_ts, node_ts-rain_ts, precip, path.decode('utf-8'), index))
            
    return pd.DataFrame(
        skeleton,
        columns=['node_timestamp', 'rain_timestamp', 'diff', 'precipitation[mm]', 'path', 'index']
    )

def main():
    # load weather data
    weather_df = pd.read_csv(
        '../data/weather-hourly.csv', 
        usecols=['datetime[utc]', 'precipitation[mm]'], 
        parse_dates=['datetime[utc]']
    )
    weather_df['datetime[epoch]'] = weather_df['datetime[utc]'].map(convert_to_epoch)
    weather_df['bool'] = weather_df['precipitation[mm]'] == 0

    norain_dates = weather_df.groupby(weather_df['datetime[utc]'].apply(lambda _: _.date()))['bool'].apply(all)
    # get only True values
    norain_dates = norain_dates[norain_dates]

    condition_nonrainy = weather_df['datetime[utc]'].apply(lambda _: _.date() in set(norain_dates.index))
    condition_2017 = weather_df['datetime[epoch]'] < convert_to_epoch(pd.Timestamp('2018-01-01'))

    # int(len(pd.read_csv('../data/audio-paths-rained.csv')) / 24) == 1191
    N = 1300    
    reduced_weather_df = (weather_df[condition_nonrainy & condition_2017]
        .sample(N, random_state=517667956)
        .reset_index(drop=True))
    reduced_weather_df = reduced_weather_df[['datetime[utc]', 'datetime[epoch]', 'precipitation[mm]']]
        
    with open('../data/nodes.txt', 'r') as f:
        lines = f.readlines()
        nodes = set(l.strip().split(' ')[0] for l in lines)

    # nodes unavailable in 2017
    unavailable_nodes = {
        'sonycnode-b827eb18a94a.sonyc', 'sonycnode-b827eb3bda47.sonyc', 'sonycnode-b827eb3e842e.sonyc',
        'sonycnode-b827eb5a9021.sonyc', 'sonycnode-b827eb5d1714.sonyc', 'sonycnode-b827eb6e8929.sonyc',
        'sonycnode-b827eb74a519.sonyc', 'sonycnode-b827eb74a9e8.sonyc', 'sonycnode-b827eb7b2c3e.sonyc',
        'sonycnode-b827eb84deb5.sonyc', 'sonycnode-b827eb8e1f0b.sonyc', 'sonycnode-b827eb8e32ad.sonyc',
        'sonycnode-b827eb977bfb.sonyc', 'sonycnode-b827ebafe148.sonyc', 'sonycnode-b827ebed47a6.sonyc',
    }

    # any node smaller than 1MB
    small_nodes = {
        'sonycnode-b827eb241343.sonyc', 'sonycnode-b827eb329ab8.sonyc', 'sonycnode-b827eb32e075.sonyc',
        'sonycnode-b827eb429cd4.sonyc', 'sonycnode-b827eb43d8f4.sonyc', 'sonycnode-b827eb73e772.sonyc',
        'sonycnode-b827eb820cfe.sonyc', 'sonycnode-b827eb8e2420.sonyc', 'sonycnode-b827eb9b859c.sonyc',
        'sonycnode-b827eb9bed23.sonyc', 'sonycnode-b827eb9d0e7f.sonyc', 'sonycnode-b827ebdd5c38.sonyc',
        'sonycnode-b827ebe1fe4b.sonyc', 'sonycnode-b827ebf9d204.sonyc', 'sonycnode-b827ebfd616c.sonyc',
    }

    available_nodes = nodes - unavailable_nodes - small_nodes
    
    read_start = time.time()
    with futures.ThreadPoolExecutor(max_workers=24) as executor:
        node_indices = dict(executor.map(read_index_file, available_nodes))
    print(f'Total time elapsed: {time.time() - read_start:.2f} seconds')
    
    closest_instances = match_closest_instances(node_indices, reduced_weather_df)

    print('Saving to ../data/audio-paths-nonrained.csv')
    create_df(node_indices, reduced_weather_df, closest_instances).to_csv('../data/audio-paths-nonrained.csv', index=False)
    
if __name__ == '__main__':
    main()