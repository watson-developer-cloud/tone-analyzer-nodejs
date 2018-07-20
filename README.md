<h1 align="center" style="border-bottom: none;">🚀 Tone Analyzer Sample Application</h1>
<h3 align="center">This Node.js app demonstrates some of the Tone Analyzer service features.
</h3>
<p align="center">
  <a href="http://travis-ci.org/watson-developer-cloud/tone-analyzer-nodejs">
    <img alt="Travis" src="https://travis-ci.org/watson-developer-cloud/tone-analyzer-nodejs.svg?branch=master">
  </a>
  <a href="#badge">
    <img alt="semantic-release" src="https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg">
  </a>
</p>
</p>

The IBM Watson [Tone Analyzer][docs] service is a cognitive linguistic analysis service that detects 7 tones which are most commonly used to detect the tone of written text. These are: anger, fear, joy, sadness, confident, analytical, and tentative.

## Prerequisites

1. Sign up for an [IBM Cloud account](https://console.bluemix.net/registration/).
1. Download the [IBM Cloud CLI](https://console.bluemix.net/docs/cli/index.html#overview).
1. Create an instance of the Tone Analyzer service and get your credentials:
    - Go to the [Tone Analyzer](https://console.bluemix.net/catalog/services/tone-analyzer) page in the IBM Cloud Catalog.
    - Log in to your IBM Cloud account.
    - Click **Create**.
    - Click **Show** to view the service credentials.
    - Copy the `apikey` value, or copy the `username` and `password` values if your service instance doesn't provide an `apikey`.
    - Copy the `url` value.

## Configuring the application

1. In the application folder, copy the *.env.example* file and create a file called *.env*

    ```
    cp .env.example .env
    ```

2. Open the *.env* file and add the service credentials that you obtained in the previous step.

    Example *.env* file that configures the `apikey` and `url` for a Tone Analyzer service instance hosted in the US East region:

    ```
    TONE_ANALYZER_IAM_APIKEY=X4rbi8vwZmKpXfowaS3GAsA7vdy17Qh7km5D6EzKLHL2
    TONE_ANALYZER_URL=https://gateway-wdc.watsonplatform.net/tone-analyzer/api
    ```

    - If your service instance uses `username` and `password` credentials, add the `TONE_ANALYZER_USERNAME` and `TONE_ANALYZER_PASSWORD` variables to the *.env* file.

    Example *.env* file that configures the `username`, `password`, and `url` for a Tone Analyzer service instance hosted in the Sydney region:

    ```
    TONE_ANALYZER_USERNAME=522be-7b41-ab44-dec3-g1eab2ha73c6
    TONE_ANALYZER_PASSWORD=A4Z5BdGENrwu8
    TONE_ANALYZER_URL=https://gateway-syd.watsonplatform.net/tone-analyzer/api
    ```
## Running locally

1. Install the dependencies

    ```
    npm install
    ```

1. Run the application

    ```
    npm start
    ```

1. View the application in a browser at `localhost:3000`

## Deploying to IBM Cloud as a Cloud Foundry Application

1. Login to IBM Cloud with the [IBM Cloud CLI](https://console.bluemix.net/docs/cli/index.html#overview)

    ```
    ibmcloud login
    ```

1. Target a Cloud Foundry organization and space.

    ```
    ibmcloud target --cf
    ```

1. Edit the *manifest.yml* file. Change the **name** field to something unique.  
  For example, `- name: my-app-name`.
1. Deploy the application

    ```
    ibmcloud app push
    ```

1. View the application online at the app URL.  
For example: https://my-app-name.mybluemix.net


## License

This sample code is licensed under Apache 2.0.  
Full license text is available in [LICENSE](LICENSE).

## Contributing

See [CONTRIBUTING](CONTRIBUTING.md).

## Open Source @ IBM

Find more open source projects on the
[IBM Github Page](http://ibm.github.io/).

[service_url]: https://www.ibm.com/watson/services/tone-analyzer/
[docs]: https://console.bluemix.net/docs/services/tone-analyzer/index.html#about
