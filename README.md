# CitySoundsWeather

The code in this project expects the following directory structure:

`./data` should contain:
- `nodes.txt` - locations of the sensors
- `weather-raw.csv` - raw weather data
- `weather.csv` - cleaned weather data

`./private` should contain:
- `decrypt.py`
- `keys/`

`./sonyc` is the mounted sonyc data

`weather-raw.csv` is from the [Iowa Environmental Mesonet](https://mesonet.agron.iastate.edu/request/download.phtml?network=NY_ASOS). From that link, select the LGA station and for data select Air Temperature [C], Wind Speed [knots], and 1 hour Precipitation [mm]. Use January 1st, 2017 - December 31st, 2018 as the date range. The rest of the options can be left at their defaults.

