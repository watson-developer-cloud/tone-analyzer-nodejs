# Tone Analyzer Starter Application [![Build Status](https://travis-ci.org/watson-developer-cloud/tone-analyzer-nodejs.svg?branch=master)](http://travis-ci.org/watson-developer-cloud/tone-analyzer-nodejs)

  The IBM Watson [Tone Analyzer][docs] service is a cognitive linguistic analysis service that detects 7 tones which are most commonly used to detect the tone of written text. These are: anger, fear, joy, sadness, confident, analytical, and tentative.

## Getting started

1. You need an IBM Cloud account. If you don't have one, [sign up][sign_up]. Experimental Watson Services are free to use.

1. Download and install the [Cloud-foundry CLI][cloud_foundry] tool if you haven't already.

1. Edit the `manifest.yml` file and change `<application-name>` to something unique. The name you use determines the URL of your application. For example, `<application-name>.mybluemix.net`.

  ```yaml
  applications:
  - services:
    - my-service-instance
    name: <application-name>
    command: npm start
    path: .
    memory: 512M
  ```

1. Connect to IBM Cloud with the command line tool.

  ```sh
  cf api https://api.ng.bluemix.net
  cf login
  ```

1. Create and retrieve service keys to access the [Tone Analyzer][docs] service:

  ```none
  cf create-service tone_analyzer lite my-tone-analyzer-service
  cf create-service-key my-tone-analyzer-service myKey
  cf service-key my-tone-analyzer-service myKey
  ```

1. Create a `.env` file in the root directory by copying the sample `.env.example` file using the following command:

  ```none
  cp .env.example .env
  ```
  You will update the `.env` with the information you retrieved in steps 5.

1. Install the dependencies you application need:

  ```none
  npm install
  ```

1. Start the application locally:

  ```none
  npm start
  ```

1. Point your browser to [http://localhost:3000](http://localhost:3000).

1. **Optional:** Push the application to IBM Cloud:

  ```none
  cf push
  ```

After completing the steps above, you are ready to test your application. Start a browser and enter the URL of your application.

            <your application name>.mybluemix.net


For more details about developing applications that use Watson Developer Cloud services in IBM Cloud, see [Getting started with Watson Developer Cloud and IBM Cloud][getting_started].


## Troubleshooting

* The main source of troubleshooting and recovery information is the IBM Cloud log. To view the log, run the following command:

  ```sh
  cf logs <application-name> --recent
  ```

* For more details about the service, see the [documentation][docs] for the Tone Analyzer.


## License

  This sample code is licensed under Apache 2.0. Full license text is available in [LICENSE](LICENSE).

## Contributing

  See [CONTRIBUTING](CONTRIBUTING.md).

## Open Source @ IBM

  Find more open source projects on the [IBM Github Page](http://ibm.github.io/)


[docs]: https://console.bluemix.net/docs/services/tone-analyzer/index.html
[cloud_foundry]: https://github.com/cloudfoundry/cli
[getting_started]: https://console.bluemix.net/docs/services/watson/index.html
[sign_up]: https://console.bluemix.net/registration/
