#Driving Lesson Booking Widget

A simple [Vue.js](http://vuejs.org/) widget which provides an example &mdash; in the context of booking driving lessons &mdash; of how to use [Acuity Scheduling](https://acuityscheduling.com/) for managing scheduling. It uses the API to search availability and to make bookings.

This repository also includes a PHP-based "wrapper", based on Silex, which serves up a single page and also acts as a "proxy" to the Acuity Scheduling API.

##Pre-requisites

* You'll need an account with Acuity Scheduling There's a 14-day trial, or even a free account.
* You'll need PHP 5.4+
* You need to have Composer installed
* You also need Bower (*)

(*) If you'd rather use npm, or download the dependencies manually, just alter the paths in `views/index.html.twig` as required.

##Setting it Up

Once you have an Actuity account, go to `Business Settings -> Integrations`. At the bottom of the page you'll find a link; "View your API Credentials". 

Make a note of your API key and User ID.

Create an appointment type, and make a note of its ID.

Take a copy of `config/__COPY_ME__.json` and save it as `{env}.json`, where `{env}` is your environment. For example, for development:

```
cp config/__COPY_ME__.json config/dev.json
```

Here's what the file will look like:

```
{  
  "debug": true,
  "userId": "",
  "apiKey": "",
  "appointmentTypeID": ""
}
```

Fill in the appropriate blanks.

Now install the PHP dependencies:

```
composer install
```

Now install the front-end dependencies:

```
bower install
```

##Running It

To run it, just make sure your web server (Apache, Nginx etc) is pointing to the `public` directory.

Alternatively to use PHP's built-in web server:

```
php -S localhost:8000
```