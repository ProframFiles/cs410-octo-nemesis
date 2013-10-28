#include "JSONReader.hpp"
#include "JSONCallbacks.hpp"
#include <iostream>
#include "stopwatch.hpp"


double ParseWithMine()
{
	akj::cStopWatch sw;
	double read = 0.0;
	double write = 0.0;

	sjp::JSONObjectIO json_tree;
	sjp::JSONReader<sjp::JSONObjectIO> reader(json_tree);

	
	reader.parseFile("tests\\test_docs\\StreetTrees_KensingtonCedarCottage.json");
	read = sw.Stop();
	sw.Start();
	//std::ofstream fout("mine.json", std::ios::binary);
	std::string str = json_tree.ToString();
	write = sw.Stop();
	std::cout << "Mine: read = " << read << ", write = " << write << std::endl;
	return read+write;
}


int main(int argc, char** argv)
{
	sjp::JSONObjectIO json_tree;
	for(int i = 0; i < argc; ++i)
	{
		printf("Arg %d: %s\n", i, argv[i]);
	}
}
