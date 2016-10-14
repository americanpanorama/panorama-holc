/** simple visualization */

#holc_ads::labels {
  text-name: [city];
  text-face-name: 'DejaVu Sans Book';
  text-size: 11;
  text-label-position-tolerance: 0;
  text-fill: #2E5387;
  text-halo-fill: #FFF;
  text-halo-radius: 1;
  text-allow-overlap: false;
  text-placement: point;
  text-placement-type: simple;
  text-horizontal-alignment: middle;
  
  [placement='west'],
  [placement='northwest'],
  [placement='southwest'] {
    text-horizontal-alignment: left;
  }
  [placement='east'],
  [placement='northeast'],
  [placement='southeast']  {
    text-horizontal-alignment: right;
  }
  [placement='default'] {
    text-fill: red;
  }
  
  [zoom<=5] {
    text-size: 7;
    
    [city='Baltimore'],
    [city='Chicago'],
    [city='Five Boroughs of New York'],
    [city='Philadelphia'],
    [city='Greater Boston'],
    [city='Detroit'],
    [city='Cleveland'],
    [city='Essex County'],
    [city='St.Louis'],
    [city='Pittsburg'],
    [city='Hudson County'],
    [city='San Francisco'],
    [city='Milwaukee Co.'],
    [city='Buffalo'] {
      text-size: 9;
    }
    
    [city='New Orleans'],
    [city='Minneapolis'],
    [city='Greater Kansas City'],
    [city='Indianapolis'],
    [city='Seattle'],
    [city='Rochester'],
    [city='Denver'],
    [city='Louisville'],
    [city='Columbus'],
    [city='Portland'],
    [city='Atlanta'],
    [city='Oakland'],
    [city='Dallas'],
    [city='StPaul'],
    [city='Toledo'],
    [city='Birmingham'],
    [city='Akron'],
    [city='Dayton'],
    [city='Syracuse'],
    [city='Oklahoma City'],
    [city='San Diego'],
    [city='Richmond'],
    [city='Staten Island'],
    [city='Jacksonville'],
    [city='Miami'],
    [city='Youngstown'],
    [city='Grand Rapids'],
    [city='New Haven'],
    [city='Flint'],
    [city='Springfield'],
    [city='Norfolk'],
    [city='Albany'],
    [city='Chattanooga'],
    [city='Trenton'],
    [city='Spokane'],
    [city='Lake County Calumet/Hammond'],
    [city='Fort wayne'],
    [city='Camden'],
    [city='Erie'],
    [city='Wichita'],
    [city='Lake County Gary'],
    [city='Knoxville'],
    [city='Tacoma'],
    [city='Canton'],
    [city='Tampa'],
    [city='Sacramento'],
    [city='South Bend'],
    [city='Duluth'],
    [city='Charlotte'],
    [city='Utica'],{
      text-size: 8;
    }
  }
  
  [zoom<=6] {
    text-size: 10;
    
    [city='Baltimore'],
    [city='Chicago'],
    [city='Five Boroughs of New York'],
    [city='Philadelphia'],
    [city='Greater Boston'],
    [city='Detroit'],
    [city='Cleveland'],
    [city='Essex County'],
    [city='St.Louis'],
    [city='Pittsburg'],
    [city='Hudson County'],
    [city='San Francisco'],
    [city='Milwaukee Co.'],
    [city='Buffalo'] {
      text-size: 13;
    }
    
    [city='New Orleans'],
    [city='Minneapolis'],
    [city='Greater Kansas City'],
    [city='Indianapolis'],
    [city='Seattle'],
    [city='Rochester'],
    [city='Denver'],
    [city='Louisville'],
    [city='Columbus'],
    [city='Portland'],
    [city='Atlanta'],
    [city='Oakland'],
    [city='Dallas'],
    [city='StPaul'],
    [city='Toledo'],
    [city='Birmingham'],
    [city='Akron'],
    [city='Dayton'],
    [city='Syracuse'],
    [city='Oklahoma City'],
    [city='San Diego'],
    [city='Richmond'],
    [city='Staten Island'],
    [city='Jacksonville'],
    [city='Miami'],
    [city='Youngstown'],
    [city='Grand Rapids'],
    [city='New Haven'],
    [city='Flint'],
    [city='Springfield'],
    [city='Norfolk'],
    [city='Albany'],
    [city='Chattanooga'],
    [city='Trenton'],
    [city='Spokane'],
    [city='Lake County Calumet/Hammond'],
    [city='Fort wayne'],
    [city='Camden'],
    [city='Erie'],
    [city='Wichita'],
    [city='Lake County Gary'],
    [city='Knoxville'],
    [city='Tacoma'],
    [city='Canton'],
    [city='Tampa'],
    [city='Sacramento'],
    [city='South Bend'],
    [city='Duluth'],
    [city='Charlotte'],
    [city='Utica'],{
      text-size: 11;
    }
  }
  [zoom=7] {
    text-size: 12;
    
    [city='Baltimore'],
    [city='Chicago'],
    [city='Five Boroughs of New York'],
    [city='Philadelphia'],
    [city='Greater Boston'],
    [city='Detroit'],
    [city='Cleveland'],
    [city='Essex County'],
    [city='St.Louis'],
    [city='Pittsburg'],
    [city='Hudson County'],
    [city='San Francisco'],
    [city='Milwaukee Co.'],
    [city='Buffalo'] {
      text-size: 15;
    }
    
    [city='New Orleans'],
    [city='Minneapolis'],
    [city='Greater Kansas City'],
    [city='Indianapolis'],
    [city='Seattle'],
    [city='Rochester'],
    [city='Denver'],
    [city='Louisville'],
    [city='Columbus'],
    [city='Portland'],
    [city='Atlanta'],
    [city='Oakland'],
    [city='Dallas'],
    [city='StPaul'],
    [city='Toledo'],
    [city='Birmingham'],
    [city='Akron'],
    [city='Dayton'],
    [city='Syracuse'],
    [city='Oklahoma City'],
    [city='San Diego'],
    [city='Richmond'],
    [city='Staten Island'],
    [city='Jacksonville'],
    [city='Miami'],
    [city='Youngstown'],
    [city='Grand Rapids'],
    [city='New Haven'],
    [city='Flint'],
    [city='Springfield'],
    [city='Norfolk'],
    [city='Albany'],
    [city='Chattanooga'],
    [city='Trenton'],
    [city='Spokane'],
    [city='Lake County Calumet/Hammond'],
    [city='Fort wayne'],
    [city='Camden'],
    [city='Erie'],
    [city='Wichita'],
    [city='Lake County Gary'],
    [city='Knoxville'],
    [city='Tacoma'],
    [city='Canton'],
    [city='Tampa'],
    [city='Sacramento'],
    [city='South Bend'],
    [city='Duluth'],
    [city='Charlotte'],
    [city='Utica'],{
      text-size: 13;
    }
  }
  [zoom=8] {
    text-size: 14;
    [city='Baltimore'],
    [city='Chicago'],
    [city='Five Boroughs of New York'],
    [city='Philadelphia'],
    [city='Greater Boston'],
    [city='Detroit'],
    [city='Cleveland'],
    [city='Essex County'],
    [city='St.Louis'],
    [city='Pittsburg'],
    [city='Hudson County'],
    [city='San Francisco'],
    [city='Milwaukee Co.'],
    [city='Buffalo'] {
      text-size: 17;
    }
    
    [city='New Orleans'],
    [city='Minneapolis'],
    [city='Greater Kansas City'],
    [city='Indianapolis'],
    [city='Seattle'],
    [city='Rochester'],
    [city='Denver'],
    [city='Louisville'],
    [city='Columbus'],
    [city='Portland'],
    [city='Atlanta'],
    [city='Oakland'],
    [city='Dallas'],
    [city='StPaul'],
    [city='Toledo'],
    [city='Birmingham'],
    [city='Akron'],
    [city='Dayton'],
    [city='Syracuse'],
    [city='Oklahoma City'],
    [city='San Diego'],
    [city='Richmond'],
    [city='Staten Island'],
    [city='Jacksonville'],
    [city='Miami'],
    [city='Youngstown'],
    [city='Grand Rapids'],
    [city='New Haven'],
    [city='Flint'],
    [city='Springfield'],
    [city='Norfolk'],
    [city='Albany'],
    [city='Chattanooga'],
    [city='Trenton'],
    [city='Spokane'],
    [city='Lake County Calumet/Hammond'],
    [city='Fort wayne'],
    [city='Camden'],
    [city='Erie'],
    [city='Wichita'],
    [city='Lake County Gary'],
    [city='Knoxville'],
    [city='Tacoma'],
    [city='Canton'],
    [city='Tampa'],
    [city='Sacramento'],
    [city='South Bend'],
    [city='Duluth'],
    [city='Charlotte'],
    [city='Utica'],{
      text-size: 15;
    }
  }
  

}