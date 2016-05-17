Vue.http.options.root = '/api';


Vue.filter('time', function ( hour ) {
  if ( hour < 10 ) {
  	return '0' + hour + ':00';	
  }
  return hour + ':00';	
  
});

Vue.filter('formatDateTime', function( day, format ) {
	if ( ! day ) {
		return '';
	}
	return day.format( format )
})

var widget = new Vue({
	
	el : '#availability-widget',

	data : {
		today : moment(),
		weekdays : moment.weekdaysShort(),		
		calendar : [],
		month : moment(),
		day : null,
		time : null,		
		hours : [],
		bookingForm : {},
		learner : {
			firstName : null,
			lastName : null,
			email : null
		},
		bookingStatus : 'pending'
	},

	ready: function() {        
    var m = moment(this.month);
    m.date(1);
    console.log(m.weekday());

    this.getAvailabilityForMonth();

  },

	computed : 	{
		selectedMonth : {
			cache: false,
			get : function() {
				return this.month.format( 'MMM YYYY' );
			}
		},
		MMdays : function(){
			
			var temp = moment( this.month ).date( 1 );
			var days = [];
			var m = temp.month();
			var now = moment();

			do {					
				days.push({
					d : temp.date(),
					past : temp.isBefore( now, 'day' ),
					today : temp.isSame( now, 'day' )
				});
				temp.add(1, 'day');
			} while ( temp.month() == m );

			return days;

		},
		_calendar : {
			cache : false,
			get : function() {
				var rows = [];				
				var temp = moment( this.month ).date( 1 );

				var items = [];

				// Some padding at the beginning
				for ( var p = 0; p < temp.weekday(); p++ )
				{					
					items.push({
						d : null
					});
				}				
				
				// Merge in the array of days
				items.push.apply( items, this.days );

				// Some padding at the end
				if ( items.length % 7 ) {
					for ( var p = ( 7 - ( items.length % 7 ) ); p > 0; p-- )
					{					
						items.push({
							d : null
						});
					}
				}

				// Split the array int chunkc of seven
				var rows = items.map( function(e,i){ 
    			return i%7===0 ? items.slice(i,i+7) : null; 
				})
				.filter(function(e){ return e; });

				return rows;
			}
		}
		/**
		hours : function() {
			var hours = [];

			var startAt = 9;
			var endAt = 17;

			for ( var h = 7; h <= 19; h++ ) {
				hours.push({
					h : h,					
					working : ( h >= startAt && h <= endAt ),
					available : !!Math.floor(Math.random() * 2)
				});
			}
			console.log( hours );
			return hours;
		}
		**/
	},

	methods : {

		/**
		 * Fetch the availability data for a given month
		 * @return {[type]} [description]
		 */
		getAvailabilityForMonth : function( ) {
			
			this.calendar = [];

			this.$http.get( 'availability/dates', { month : this.month.format( 'YYYY-MM' ) } ).then( function( response ) {          
					
				this.days = [];

				var available = response.data.map( function( item ) {
					return moment( item.date ).date( );
				});				

				var temp = moment( this.month ).date( 1 );				
				var m = temp.month();
				var now = moment();

				do {					
					this.days.push({
						d : temp.date(),
						past : temp.isBefore( now, 'day' ),
						today : temp.isSame( now, 'day' ),
						available : ( available.indexOf( temp.date() ) > -1 ),
					});					
					temp.add( 1, 'day' );
				} while ( temp.month() == m );

				this.buildCalendar();

			});
		},
		buildCalendar : function() 
		{			
			var rows = [];							
			var items = [];

			// Some padding at the beginning
			for ( var p = 0; p < moment( this.month ).date( 1 ).weekday(); p++ )
			{					
				items.push({
					d : null
				});
			}				
			
			// Merge in the array of days
			items.push.apply( items, this.days );

			// Some padding at the end if required
			if ( items.length % 7 ) {
				for ( var p = ( 7 - ( items.length % 7 ) ); p > 0; p-- )
				{					
					items.push({
						d : null
					});
				}
			}

			// Split the array int chunkc of seven
			var rows = items.map( function( e, i ) { 
  			return i % 7 === 0 ? items.slice( i, i + 7 ) : null; 
			})
			.filter( function( e ) { return e; } );

			this.$set( 'calendar', rows );
		},		
		previousMonth : function() {			
			var current = this.month;
			this.$set( 'month', null )
			this.$set( 'month', current.subtract( 1, 'months' ) );		
			this.getAvailabilityForMonth();	
		},
		nextMonth : function() {			
			var current = this.month;
			this.$set( 'month', null )
			this.$set( 'month', current.add( 1, 'months' ) );			
			this.getAvailabilityForMonth();
		},
		selectDay : function( d ) {
			
			if ( d ) {
				// Create am instance
				var day = moment( this.month ).date ( d );

				// If it's in the past, exit
				if ( day.isBefore( moment(), 'day ') ) {
					return;
				}

				this.day = day;
				this.hours = [];

				this.$http.get( 'availability/times', { date : this.day.format( 'YYYY-MM-DD' ) } ).then( function( response ) {          
					
					var available = response.data.map( function( item ) {
						return moment( item.time ).hour( );
					});

					for ( var h = 7; h <= 19; h++ ) {						
						this.hours.push({
							h : h,												
							available : ( available.indexOf( h ) > -1 )
						});
					}

				});

				//this.$recompute('hours')
				this.time = null;
			}
		},
		
		selectHour : function( hour ) {		

			if ( hour.available ) {
			
				this.time = moment( this.day ).hours( hour.h ).minutes( 0 ).seconds( 0 );			

			}

		},
		
		confirm : function( )
		{
			if ( this.bookingForm.$valid ) {

				this.bookingStatus = 'sending';

				var data = this.learner;
				data.datetime = this.time.format();
		
				this.$http.post( 'appointments', data ).then( function( response ) {          			
					
					this.booking = response.data;
					this.bookingStatus = 'confirmed';
					
				});

			} else {
				console.log( 'form is invalid' );
			}

		},

		reset : function() 
		{

			this.day = null;
			this.time = null;
			this.bookingStatus = 'pending';
			this.booking = null;
			this.learner = {
				firstName : null,
				lastName : null,
				email : null
			};

		}

	}

});
