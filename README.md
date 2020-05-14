# CitySoundsWeather

## Intro

You can see a demo of the [visualization tool here](https://city-sounds-rain.now.sh). The code for this tool is in a separate [GitLab repository](https://gitlab.com/dkerriga/city-sounds-rain).

The goal of this project is to detect precipitation in SONYC data. This repository contains the code for data processing and for model training and testing. The data itself is not included in the repository, nor are the private keys used to decrypt the audio data.

## Structure

The code in this project expects the following directory structure:

`./data` should contain:
- `weather-hourly-raw.csv` - raw weather data
- `nodes.txt` - locations of the sensors (only used be the `notebooks/sensor_locations.ipynb` to create a map).

`./private` should contain:
- `decrypt.py`
- `keys/`

`./sonyc` should be the mounted SONYC data directory on prince

You can get `./data/weather-hourly-raw.csv` from the [Iowa Environmental Mesonet](https://mesonet.agron.iastate.edu/request/download.phtml?network=NY_ASOS). From that link, select the LGA station and for data select Air Temperature [C], Wind Speed [knots], and 1 hour Precipitation [mm]. Use January 1st, 2017 - December 31st, 2018 as the date range. For limit report types, choose "Routine + SPECIals". The rest of the options can be left at their defaults.

## Contents

- `report.pdf` is our written report
- `library/searcher.py` contains code for reading indices from the SONYC dataset.
- `scripts-bash/weather-hourly-cleaner.bash` calls a Python script to transform the raw weather data in `../data/weather-hourly-raw.csv` into `../data/weather-hourly.csv`.
- `scripts-python`
  - `weather-hourly-cleaner.py` is the Python script called by `scripts-bash/weather-hourly-cleaner.bash`.
  - `create-rainy-instance-list.py` creates `../data/audio-paths-rained.csv`, which matches rows containing rain from `../data/weather-hourly.csv` with recordings from the SONYC dataset.
  - `create-nonrainy-instance-list.py` creates `../data/audio-paths-nonrained.csv`, which is similar to the above except for when there is no precipitation.
- `notebooks`
  - Early stage exploration and experiments:
    - `exploring_rain_sounds.ipynb` plays an audio clip that contains rain
    - `exploring_spl.ipynb` is our initial baseline, which was unsuccessful and prompted a shift in our approach.
    - `sensor_locations.ipynb` creates a map of the sensors.
    - `spl_visualizations.ipynb` creates visualizations that compare precipitation and sound pressure level
    - `class_visualizations.ipynb` creates scatterplots comparing hourly precipitation with the mean predicted probability for a coarse UST label in that hour.
  - Data processing:
    - `get_spl_data.ipynb` prepares the SPL data.
    - `get_class_prediction_data.ipynb` prepares the coarse and fine grained UST label predicted probability data
  - Model training and validation (experiments without using testing data):
    - `coarse_class_prediction_model_validation.ipynb` uses coarse grained labels
    - `fine_class_prediction_model_validation.ipynb` uses fine grained labels
  - Model training and testing for the final results (uses testing data):
    - `spl_model_test.ipynb` uses SPL summary statistics
    - `coarse_class_prediction_model_test.ipynb` uses predicted probabilities of coarse labels
    - `fine_class_prediction_model_test.ipynb` uses predicted probabilities of fine labels
- `prince` contains the code for getting audio embeddings and training and testing the models with them. This code is meant to be run on NYU's HPC cluster, prince.

