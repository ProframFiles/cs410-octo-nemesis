#include "JSONReader.hpp"
#include "JSONCallbacks.hpp"
#include "json/json.h"
#include "json/reader.h"
#include <iostream>
#include "stopwatch.hpp"

double ParseWithJsonCPP()
{
	akj::cStopWatch sw;
	double read = 0.0;
	double write = 0.0;
	Json::Value root;   // will contains the root value after parsing.
	Json::Reader reader;
	std::ifstream fin("tests/test_docs/StreetTrees_KensingtonCedarCottage.json", std::ios::binary);
	bool parsingSuccessful = reader.parse(fin, root);
	if(!parsingSuccessful)
	{
		// report to the user the failure and their locations in the document.
		std::cout  << "Failed to parse configuration\n" << reader.getFormatedErrorMessages();
		return 0.0;
	}
	read = sw.Stop();

	// Get the value of the member of root named 'encoding', return a 'null' value if
	// there is no such member.



	// ...
	// At application shutdown to make the new configuration document:
	// Since Json::Value has implicit constructor for all value types, it is not
	// necessary to explicitly construct the Json::Value object:
	

	Json::StyledWriter writer;
	sw.Start();
	// Make a new JSON document for the configuration. Preserve original comments.
	std::string outputConfig = writer.write(root);

	//std::ofstream fout("JSONcpp.json", std::ios::binary);
	// And you can write to a stream, using the StyledWriter automatically.
	//fout << outputConfig;
	
	write = sw.Stop();

	std::cout << "JsonCPP: read = " << read << ", write = " << write << std::endl;

	return read+write;
}

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
	for(int i = 0; i < 20 ; ++i)
	ParseWithMine();
	for(int i = 0; i < 20 ; ++i)
	ParseWithJsonCPP();
	return 0;
}
