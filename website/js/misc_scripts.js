function To8BitColor(val)
{
	return Math.round(Math.max(Math.min(val, 1.0), 0.0)*255.0);
}

function HueToRGBString(hue)
{
	var h = hue*6.0;
	if(Math.floor(hue) != hue)
	{
		h = (hue-Math.floor(hue))*6.0; 
	}
	var r = To8BitColor(-1.0+Math.abs(3.0-h));
	var g = To8BitColor( 2.0-Math.abs(2.0-h));
	var b = To8BitColor( 2.0-Math.abs(4.0-h));
	return "rgb(" +r+","+ g+"," +b+")";
};
