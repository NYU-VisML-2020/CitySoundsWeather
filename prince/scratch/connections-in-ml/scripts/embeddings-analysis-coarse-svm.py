import pickle

from time import strftime

from sklearn.svm import SVC

import job_helpers

if __name__ == '__main__':
    training_data, testing_data = job_helpers.get_data()
    
    X_train, y_train = job_helpers.organize_data(training_data)
    X_test, y_test = job_helpers.organize_data(testing_data)

    model_name = 'coarse-svm'
    print(strftime(f'[%T] begin training {model_name}'))
    model = SVC(
        C=10,
        kernel='rbf'
    )
    model.fit(X_train, y_train)
    print(strftime(f'[%T] done training {model_name}'))
    print(strftime(f'[%T] {model_name} metrics:'))
    y_pred = model.predict(X_test)
    job_helpers.get_metrics(y_test, y_pred)

    filename = f'../saved-models/{model_name}.model'
    pickle.dump(model, open(filename, 'wb'))
