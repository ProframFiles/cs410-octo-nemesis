var Spline = function(data)
{
	this.data = data;
	// clamp the degree to between 0-3
	this.degree = Math.max(Math.min(this.data.length -1, 3), 0);
}

spline.prototype.getPoint(t)
{
}

Spline.prototype.getDirection(t)
{

}
