<?php
require_once __DIR__.'/../vendor/autoload.php';

use Symfony\Component\HttpFoundation\Request,
		Symfony\Component\HttpFoundation\Response,
		Monolog\Logger,
		Monolog\Handler\StreamHandler;

$app = new Silex\Application( );

/**
 * Set the current environment.
 */
$env = getenv('APP_ENV') ?: 'dev';

/**
 * Register the configuration service provider.
 * If the environment is `dev`, then it'll load the file `config/dev.json`.
 */
$app->register( new Igorw\Silex\ConfigServiceProvider( __DIR__ . "/../config/$env.json" ) );

// Set up the Twig templating engine
$app->register( new Silex\Provider\TwigServiceProvider(), [
	'twig.path' => __DIR__.'/../views',
] );

/**
 * Override the normal Twig lexer, so that we can use Vue's doube-curly-brackets 
 * without interference from Twig.
 */
$lexer = new Twig_Lexer($app['twig'], array(
    'tag_comment'   => array('{#', '#}'),
    'tag_block'     => array('{%', '%}'),
    'tag_variable'  => array('{{{', '}}}'),
    'interpolation' => array('#{', '}'),
));
$app['twig']->setLexer($lexer);

/**
 * Inject the Acuity Scheduling client
 */
$app[ 'client' ] = $app->share( function( ) use ( $app ) {
	return new AcuityScheduling( [
	  'base' => 'https://acuityscheduling.com',
	  'userId' => $app[ 'userId' ],
	  'apiKey' => $app[ 'apiKey' ],
	] );
} );

/**
 * Set up logging
 */
$app[ 'logger' ] = $app->share( function( ) use ( $app ) {	
	$logger = new Logger('errors');	
	$logger->pushHandler(new StreamHandler(__DIR__.'/../logs/error.log', Logger::ERROR));
	return $logger;
} );

/**
 * Acts as a proxy to `/availability/dates` and `/availability/times`
 * We can use these two in conjunction to find an available date, then drill down
 * and find an available time / slot.
 */
$app->get( 'api/availability/{period}', function( Request $request, $period ) use ( $app ) {

	// Build the URL, incorporating the `appointmentTypeID`.
	$query = $request->query->all( ) + [ 'appointmentTypeID' => $app[ 'appointmentTypeID' ] ];	
	$url = sprintf( '/availability/%s?%s', $period, http_build_query( $query ) );

	// Make the request...
	$response = $app[ 'client' ]->request( $url );		

	// If there's an error, write it to the log
	if ( $response[ 'status_code' ] !== 200 ) {
		$app[ 'logger' ]->error( $response[ 'message' ] );
	}

	// ... and simply return it
	return json_encode( $response );

} )
->assert( 'period', 'dates|times|classes');

/**
 * Acts as a proxy to `/appointments`
 * We can use this to actually make an appointment
 */
$app->post( 'api/appointments', function( Request $request ) use ( $app ) {

	// Build the data by decoding the JSON and then injecting the `appointmentTypeID`.
	$data = json_decode( $request->getContent(), true ) + [ 'appointmentTypeID' => $app[ 'appointmentTypeID' ] ];	

	// Make the request...
	$response = $app[ 'client' ]->request( 
		'/appointments',
		[
			'method'	=>	'POST',
			'data'		=>	$data,
		]
	);		

	// If there's an error, write it to the log
	if ( $response[ 'status_code' ] !== 200 ) {
		$app[ 'logger' ]->error( $response[ 'message' ] );
	}

	// ...and return it
	return json_encode( $response );

} );

/**
 * Returns the page.
 */
$app->get( '', function( ) use ( $app ) {

	return $app[ 'twig' ]->render( 'index.html.twig' );

} );

/**
 * Run the Silex application
 */
$app->run( );