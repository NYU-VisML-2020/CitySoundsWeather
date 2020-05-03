import os

from time import strftime

import h5py
import numpy as np
import pandas as pd

from sklearn.metrics import accuracy_score, confusion_matrix, f1_score

SEED = 2660280232880537243 % 2**32

EMBEDDINGS_PATH = '../data/embeddings/'

# data preprocessing functions
def extract_index(node):
    file_path = EMBEDDINGS_PATH + f'{node}-features.h5'
    with h5py.File(file_path, 'r') as node_f:
        embedding_rainy_indices = pd.DataFrame(node_f['rainy']['timestamp'], columns=['node_timestamp']).reset_index()
        embedding_rainy_indices['class'] = 1

        embedding_nonrainy_indices = pd.DataFrame(node_f['nonrainy']['timestamp'], columns=['node_timestamp']).reset_index()
        embedding_nonrainy_indices['class'] = 0

        combined_df = pd.concat([embedding_rainy_indices, embedding_nonrainy_indices])
        combined_df['node'] = node
        
    return combined_df

def merge_indices():
    indices = [extract_index(node) for node in map(lambda _: _[:28], os.listdir(EMBEDDINGS_PATH))]
    return pd.concat(indices).reset_index(drop=True).rename(columns={'index': 'embedding_index'})

def organize_data(input_df):
    index_df = merge_indices()
    merged_df = pd.merge(index_df, input_df, how='inner', on=['node_timestamp', 'class', 'node'])
    
    nodes = iter(merged_df['node'].drop_duplicates())
    X = []
    y = []
    for node in nodes:
        file_path = EMBEDDINGS_PATH + f'{node}-features.h5'
        embedding_indices = merged_df[merged_df['node'] == node][['embedding_index', 'class']]
        
        with h5py.File(file_path, 'r') as node_f:
            for (_, info) in embedding_indices.iterrows():
                if info['class']:
                    new_vec = node_f['rainy'][info['embedding_index']]['openl3']
                else:
                    new_vec = node_f['nonrainy'][info['embedding_index']]['openl3']
                X.append(new_vec.reshape(-1))
                y.append(info['class'])
                
    return np.stack(X), np.array(y)

def get_data():
    training_data = pd.read_csv(
        '../data/predictions-coarse-train.csv',
        usecols=[
            'node_timestamp',
            'precipitation[mm]',
            'node',
        ],
    )
    training_data['class'] = training_data['precipitation[mm]'].map(lambda _: int(_ > 0))
    
    testing_data = pd.read_csv(
         '../data/predictions-coarse-test.csv',
        usecols=[
            'node_timestamp',
            'precipitation[mm]',
            'node',
        ],
    )
    testing_data['class'] = testing_data['precipitation[mm]'].map(lambda _: int(_ > 0))
    
    return training_data, testing_data

def get_metrics(y_true, y_pred, show=True):
    f1 = f1_score(y_true, y_pred, average='binary')
    acc = accuracy_score(y_true, y_pred)
    tn, fp, fn, tp = confusion_matrix(y_true, y_pred).ravel()
    
    if show:
        print(strftime(f'[%T] F1 score: {f1:0.3}'))
        print(strftime(f'[%T] Accuracy: {acc:0.2%}'))
        print(strftime(f'[%T] TN: {tn}, FP: {fp}, FN: {fn}, TP: {tp}'))
        
    return {
        'F1': f1,
        'Accuracy': acc,
        'Confusion Matrix': [tn, fp, fn, tp],
    }
