import os

from time import strftime

import h5py
import numpy as np
import pandas as pd

SONYC_PATH = '/beegfs/work/sonyc/'
OPEN_L3 = 'features/openl3/2017/'

node_paths = os.listdir(SONYC_PATH + OPEN_L3)

rainy_df = pd.read_csv('data/audio-paths-rained.csv')
nonrainy_df = pd.read_csv('data/audio-paths-nonrained.csv')

rainy_nodes = rainy_df['path'].map(lambda _: _.split('/')[2])
nonrainy_nodes = nonrainy_df['path'].map(lambda _: _.split('/')[2])

node_set = set(rainy_nodes) & set(nonrainy_nodes)

for i, node_path in enumerate(node_paths):
    node = node_path.split('_')[0]

    print(strftime(f'[%T] On node {node}'))

    rainy_matches = rainy_df[rainy_nodes == node]['node_timestamp'].values
    nonrainy_matches = nonrainy_df[nonrainy_nodes == node]['node_timestamp'].values

    if not rainy_matches.any() or not nonrainy_matches.any():
        print(strftime('[%T] No matches found for this node'))
        continue

    feature_path = SONYC_PATH + OPEN_L3 + node_path
    with h5py.File(feature_path, 'r') as feature_file:
        print(strftime('[%T] Extracting feature'))
        
        timestamps = feature_file['openl3']['timestamp']
	
        xy_rainy, feature_rainy_ind, rainy_ind = np.intersect1d(
            timestamps,
            rainy_matches,
            return_indices=True
        )
        xy_nonrainy, feature_nonrainy_ind, nonrainy_ind = np.intersect1d(
            timestamps,
            nonrainy_matches,
            return_indices=True
        )

        if not any(feature_rainy_ind) or not any(feature_nonrainy_ind):
            print(strftime('[%Y] No overlap found for this node'))
            continue

        with h5py.File(os.getcwd() + f'/nodes/{node}-features.h5', 'w') as write_file:
            print(strftime(f'[%T] Creating {node}-features.h5 file'))

            write_file.create_dataset(
                'rainy',
                data=feature_file['openl3'][list(np.sort(feature_rainy_ind))]
            )
            write_file.create_dataset(
                'nonrainy',
                data=feature_file['openl3'][list(np.sort(feature_nonrainy_ind))]
            )
