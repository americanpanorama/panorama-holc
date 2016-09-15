
/** simple visualization */
#holc_ads::labels {
  text-name: [city];
  text-face-name: 'DejaVu Sans Book';
  text-size: 10;
  text-label-position-tolerance: 0;
  text-fill: #0F3B82;
  text-halo-fill: #FFF;
  text-halo-radius: 1;
  text-dy: -10;
  text-allow-overlap: false;
  text-placement: point;
  text-placement-type: simple;
  /** west **/
  [zoom<=6][city='Dayton'],
  [zoom<=6][city='Hamilton'],
  [zoom<=6][city='Racine'],
  [zoom<=6][city='Saginaw'],
  [zoom<=6][city='Lorain'],
  [zoom<=6][city='Canton'], 
  [zoom<=6][city='Poughkeepsie'],
  [zoom<=6][city='Essex County'], 
  [zoom<=6][city='Waltham'] {
    text-dy: 0;
    text-dx: -10;
    text-horizontal-alignment: left;
  }
  
  /** northwest **/
  
  
  /** southwest **/
  [zoom<=6][city='San Francisco'],
  [zoom<=6][city='St.Petersburg'] {
    text-dy: 6;
    text-dx: -6;
    text-horizontal-alignment: left;
  }
  
  
  /** east **/
  [zoom<=6][city='Boston'], 
  [zoom<=6][city='Grand Rapids'],
  [zoom<=6][city='Battle Creek'],
  [zoom<=6][city='Pontiac'],
  [zoom<=6][city='Detroit'], 
  [zoom<=6][city='New Castle'],
  [zoom<=6][city='New Haven'], 
  [zoom<=6][city='Stamford, Darien, and New Canaan'] {
    text-dy: 0;
    text-dx: 9;
    text-horizontal-alignment: right;
  }
  
  /** custom **/
  [zoom<=6][city='Oakland'] {
    text-dy: -10;
    text-dx: 8;
    text-horizontal-alignment: left;
  }
  
  [zoom<=6][city='Youngstown'] {
    text-dy: -7;
    text-dx: 62;
    text-horizontal-alignment: left;
  }
  
  [zoom<=6][city='New Britain'] {
    text-dy: 4;
    text-dx: 62;
    text-horizontal-alignment: left;
  }
  
  [zoom>=6][city='Bronx'] {
    text-dy: 1;
    text-dx: 42;
    text-horizontal-alignment: left;
  }
  
  [zoom>=6][city='Manhattan'] {
    text-dy: -10;
    text-dx: -2;
    text-horizontal-alignment: left;
  }
  
  [zoom<=6][city='Boston'] {
    text-dy: 0;
    text-dx: 42;
    text-horizontal-alignment: left;
  }
  
  /** south **/
  [zoom<=6][city='Montgomery'],
  [zoom<=6][city='Greensboro'],
  [zoom<=6][city='Norfolk'],
  [zoom<=6][city='Roanoke'],
  [zoom<=6][city='Joliet'],
  [zoom<=6][city='Kenosha'],
  [zoom<=6][city='Troy'], 
  [zoom<=6][city='Johnstown'],
  [zoom<=6][city='Staten Island'],
  [zoom<=6][city='Braintree'],
  [zoom<=6][city='San Jose'],
  [zoom<=6][city='Tacoma'],
  [zoom<=6][state='IL'][city='Springfield'],{
    text-dy: 10;
    text-dx: 0;
    text-horizontal-alignment: middle;
  }

  /** east **/
  [zoom=5][city='Boston'], 
  [zoom=5][city='Grand Rapids'],
  [zoom=5][city='Battle Creek'],
  [zoom=5][city='Pontiac'],
  [zoom=5][city='Detroit'], 
  [zoom=5][city='New Castle'],
  [zoom=5][city='New Haven'], 
  [zoom=5][city='Stamford, Darien, and New Canaan'] {
    text-dy: 0;
    text-dx: 18;
    text-horizontal-alignment: right;
  }
   
  
}