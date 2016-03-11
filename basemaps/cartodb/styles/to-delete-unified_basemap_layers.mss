@water: #dde9e9;
@waterlines: #aacccc;
@land: #f9f9f9;

Map {
  buffer-size: 128;
  background-color: @water;
}

#unified_basemap_layers[layer='ne_10m_coastline_2163']{
  line-color: @waterlines;
  line-width: 0.75;
  line-opacity: 1;
  line-join: round;
  line-cap: round;
}

#unified_basemap_layers[layer='ne_10m_lakes_2163'] {
  line-color: @waterlines;
  line-width: 2.5;
  line-opacity: 1;
  line-join: round;
  line-cap: round;

  /* Soften lines at lower zooms */
  [zoom<=7] {
    line-width: 2.5;
    line-color: lighten(desaturate(#aacccc,2%),2%);
  }
  [zoom<=5] {
    line-width: 1.5;
    line-color: lighten(desaturate(#aacccc,5%),5%);
  }

  /* Separate attachment because seams */
  ::fill {
    polygon-fill: @water;
    polygon-opacity: 1;
  }

  /* Remove small lakes at lower zooms */
  [scalerank>3][zoom<=5] {
    ::fill {
      polygon-opacity: 0;
    }
    line-opacity: 0;
  }
  [scalerank>6][zoom<=7] {
    ::fill {
      polygon-opacity: 0;
    }
    line-opacity: 0;
  }
}

#unified_basemap_layers[layer='ne_10m_rivers_lake_centerlines_2163'] {
  line-color: @waterlines;
  line-width: 1.5;
  line-opacity: 1;
  line-join: round;
  line-cap: round;

  [name='Mississippi'],
  [name='St. Lawrence'],
  [name='Columbia'],
  [name='Ohio'],
  [name='Hudson'],
  [name='Missouri'],
  [name='Rio Grande'] {
    line-width: 4;
  }
  [zoom<=8][name='Mississippi'],
  [zoom<=8][name='St. Lawrence'],
  [zoom<=8][name='Columbia'],
  [zoom<=8][name='Ohio'],
  [zoom<=8][name='Hudson'],
  [zoom<=8][name='Missouri'],
  [zoom<=8][name='Rio Grande'] {
    line-width: 2;
  }
  [zoom<=8][name!='Mississippi'][name!='St. Lawrence'][name!='Rio Grande'][name!='Ohio'][name!='Hudson'][name!='Columbia'][name!='Missouri'],
  [zoom<=6][name='Mississippi'],
  [zoom<=6][name='Columbia'],
  [zoom<=6][name='Ohio'],
  [zoom<=6][name='Hudson'],
  [zoom<=6][name='Missouri'],
  [zoom<=6][name='Rio Grande'] {
    line-width: 1;
    line-color: lighten(desaturate(@waterlines,2%),2%);
  }
  [zoom<=6][name!='Mississippi'][name!='St. Lawrence'][name!='Rio Grande'][name!='Ohio'][name!='Hudson'][name!='Columbia'][name!='Missouri'] {
    line-width: 0.5;
    line-color: lighten(desaturate(@waterlines,5%),5%);
  }
  [zoom<=5][name!='Mississippi'][name!='St. Lawrence'][name!='Rio Grande'][name!='Ohio'][name!='Hudson'][name!='Columbia'][name!='Missouri'] {
    line-width: 0;
  }
  [zoom<=5][name='Mississippi'],
  [zoom<=5][name='St. Lawrence'],
  [zoom<=5][name='Columbia'],
  [zoom<=5][name='Ohio'],
  [zoom<=5][name='Hudson'],
  [zoom<=5][name='Missouri'],
  [zoom<=5][name='Rio Grande'] {
    line-width: 0.5;
    line-color: lighten(desaturate(@waterlines,2%),2%);
  }
}

#unified_basemap_layers[layer='ne_10m_admin_0_countries_lakes_2163'] {

  line-color: @land;
  line-width: 1;
  line-opacity: 1;
  line-join: round;
  line-cap: round;
  polygon-fill: @land;
  polygon-opacity: 1;

}
