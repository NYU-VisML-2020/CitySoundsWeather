import base64
import h5py
import os
import pandas as pd
import sys

sys.path.append('/'.join(os.getcwd().split('/')[:-1]))
from private.decrypt import readEncryptedTarAudioFile

def convert_to_epoch(stamp):
    return (stamp - pd.Timestamp('1970-01-01')) // pd.Timedelta('1s')

# NOT FOR USE
def save_file(arg):
    path, index, audio_path, audio_key = arg
    fname = path + f'{index}.mp3'
    sound_data = base64.decodebytes(
        readEncryptedTarAudioFile(
            '../sonyc/' + audio_path,
            audio_key
        )
    )

    with open(fname, 'wb') as f:
        f.write(sound_data)

class Searcher:
    def __init__(self, node, year=2017):
        self.node = node
        
        self.local_audio_path = f'../sounds/{year}/{node}/'
        
        index_path = f'../sonyc/indices/{year}/{node}_recording_index.h5'
        self.information = h5py.File(index_path, 'r')['recording_index']
        self.timestamps = pd.DataFrame(self.information['timestamp'], columns=['epoch'])
        
    def return_interval(self, start, stop=None):
        if stop is None:
            stop = start + pd.Timedelta(minutes=60)
            
        lower_bound = convert_to_epoch(start) <= self.timestamps['epoch']
        upper_bound = self.timestamps['epoch'] < convert_to_epoch(stop)
        
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
    
    def save_audio_by_day(self, day):
        path = self.local_audio_path + f'{day}/'
        if os.path.exists(path):
            print('directory already exists')
            return
        else:
            os.makedirs(path)
            
        today = pd.Timestamp(day)
        next_day = today + pd.Timedelta('1d')
        
        interval = self.return_interval(today, next_day)
        
        N = len(interval.index)
        print(f'{N} files to save')
        for count, index in enumerate(interval.index):
            print(count)
            fname = path + f'{index}.mp3'
            audio_path = self.information[index][1].decode('utf-8')
            audio_key = self.information[index][2]
            sound_data = base64.decodebytes(
                readEncryptedTarAudioFile(
                    '../sonyc/' + audio_path,
                    audio_key
                )
            )

            with open(fname, 'wb') as f:
                f.write(sound_data)
                
            if (count+1) % 100 == 0:
                print(f'{count+1} of {N} files saved')