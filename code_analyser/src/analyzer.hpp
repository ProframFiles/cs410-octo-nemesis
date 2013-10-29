#ifndef HPP_analyzer
#define HPP_analyzer

#include <string>
namespace sjp{
	class JSONObjectIO;
}

int RunOnSourceFile(std::string home_dir, std::string absolute_file, sjp::JSONObjectIO* json_out);



#endif // HPP_analyzer