import pickle

from time import strftime

from sklearn.neural_network import MLPClassifier

import job_helpers

if __name__ == '__main__':
    training_data, testing_data = job_helpers.get_data()
    
    X_train, y_train = job_helpers.organize_data(training_data)
    X_test, y_test = job_helpers.organize_data(testing_data)

    model_name = 'coarse-nn'
    print(strftime(f'[%T] begin training {model_name}'))
    model = MLPClassifier(
        activation='relu',
        alpha=0.001,
        hidden_layer_sizes=(32, 64),
        learning_rate_init=0.001,
        solver='adam'
    )
    model.fit(X_train, y_train)
    print(strftime(f'[%T] done training {model_name}'))
    print(strftime(f'[%T] {model_name} metrics:'))
    y_pred = model.predict(X_test)
    job_helpers.get_metrics(y_test, y_pred)

    filename = '../saved-models/{model_name}.model'
    pickle.dump(model, open(filename, 'wb'))
