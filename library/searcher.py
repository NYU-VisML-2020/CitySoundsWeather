import base64
import h5py
import os
import pandas as pd
import sys

sys.path.append('/'.join(os.getcwd().split('/')[:-1]))
from private.decrypt import readEncryptedTarAudioFile

def convert_to_epoch(stamp):
    return (stamp - pd.Timestamp('1970-01-01')) // pd.Timedelta('1s')

class Searcher:
    def __init__(self, node):
        self.node = node
        
        index_path = f'../sonyc/indices/2017/{node}_recording_index.h5'
        self.information = h5py.File(index_path, 'r')['recording_index']
        self.timestamps = pd.DataFrame(self.information['timestamp'], columns=['epoch'])
        
    def return_interval(self, start, stop=None):
        if stop is None:
            stop = start + pd.Timedelta(minutes=60)
            
        lower_bound = convert_to_epoch(start) <= self.timestamps['epoch']
        upper_bound = self.timestamps['epoch'] <= convert_to_epoch(stop)
        
        interval = self.timestamps[lower_bound & upper_bound].reset_index()
        interval['utc'] = pd.to_datetime(
            interval['epoch'], 
            unit='s', 
            utc=True, 
            infer_datetime_format=True
        )
        
        return interval
    
    def get_audio(self, index):
        information = self.information[index]
        audio_path = '../sonyc/' + information[1].decode('utf-8')
        return base64.decodebytes(readEncryptedTarAudioFile(audio_path, information[2]))