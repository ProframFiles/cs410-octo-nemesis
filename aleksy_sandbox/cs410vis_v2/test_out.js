const kTestJSON =
{
	"doom3" : 
	[
		{
			"qualifiedName" : "podstruct",
			"name" : "podstruct",
			"filename" : "E:/storage/work/cs410/project/cs410-octo-nemesis/code_to_analyze/sample_streaming_json/test_analysis_source.cpp",
			"index" : 0,
			"USR" : "c__S_podstruct",
			"declarationSize" : 90,
			"timeSpent" : 0.000278,
			"parentArray" : 
			[ ],
			"childIndexArray" : 
			[ ],
			"methodCalls" : 
			[ {
	"callerIndex" : 2,
	"count" : 3
} ],
			"memberDataRefs" : 
			[ {
	"callerIndex" : 2,
	"count" : 1
} ],
			"methods" : 
			[
				{
					"name" : "podstruct",
					"numBytes" : 38
				},
				{
					"name" : "podstruct",
					"numBytes" : 0
				}
			]
		},
		{
			"qualifiedName" : "Base",
			"name" : "Base",
			"filename" : "E:/storage/work/cs410/project/cs410-octo-nemesis/code_to_analyze/sample_streaming_json/test_analysis_source.cpp",
			"index" : 1,
			"USR" : "c__C_Base",
			"declarationSize" : 47,
			"timeSpent" : 0.000189,
			"parentArray" : 
			[ ],
			"childIndexArray" : 
			[
				2,
				4
			],
			"methodCalls" : 
			[ ],
			"memberDataRefs" : 
			[ ],
			"methods" : 
			[ {
	"name" : "Base",
	"numBytes" : 0
} ]
		},
		{
			"qualifiedName" : "d1::Derived1",
			"name" : "Derived1",
			"filename" : "E:/storage/work/cs410/project/cs410-octo-nemesis/code_to_analyze/sample_streaming_json/test_analysis_source.cpp",
			"index" : 2,
			"USR" : "c__N_d1_C_Derived1",
			"declarationSize" : 172,
			"timeSpent" : 0.000448,
			"parentArray" : 
			[ 1 ],
			"childIndexArray" : 
			[
				3,
				5
			],
			"methodCalls" : 
			[ ],
			"memberDataRefs" : 
			[ ],
			"methods" : 
			[
				{
					"name" : "DerivedMethod1",
					"numBytes" : 104
				},
				{
					"name" : "Derived1",
					"numBytes" : 0
				}
			]
		},
		{
			"qualifiedName" : "Derived2",
			"name" : "Derived2",
			"filename" : "E:/storage/work/cs410/project/cs410-octo-nemesis/code_to_analyze/sample_streaming_json/test_analysis_source.cpp",
			"index" : 3,
			"USR" : "c__C_Derived2",
			"declarationSize" : 73,
			"timeSpent" : 0.000223,
			"parentArray" : 
			[ 2 ],
			"childIndexArray" : 
			[ ],
			"methodCalls" : 
			[ ],
			"memberDataRefs" : 
			[ ],
			"methods" : 
			[ {
	"name" : "Derived2",
	"numBytes" : 0
} ]
		},
		{
			"qualifiedName" : "MemberDerived",
			"name" : "MemberDerived",
			"filename" : "E:/storage/work/cs410/project/cs410-octo-nemesis/code_to_analyze/sample_streaming_json/test_analysis_source.cpp",
			"index" : 4,
			"USR" : "c__C_MemberDerived",
			"declarationSize" : 60,
			"timeSpent" : 0.000258,
			"parentArray" : 
			[ 1 ],
			"childIndexArray" : 
			[ 5 ],
			"methodCalls" : 
			[ ],
			"memberDataRefs" : 
			[ ],
			"methods" : 
			[ {
	"name" : "MemberDerived",
	"numBytes" : 0
} ]
		},
		{
			"qualifiedName" : "multi::MultiDerived",
			"name" : "MultiDerived",
			"filename" : "E:/storage/work/cs410/project/cs410-octo-nemesis/code_to_analyze/sample_streaming_json/test_analysis_source.cpp",
			"index" : 5,
			"USR" : "c__N_multi_C_MultiDerived",
			"declarationSize" : 107,
			"timeSpent" : 0.000293,
			"parentArray" : 
			[
				2,
				4
			],
			"childIndexArray" : 
			[ ],
			"methodCalls" : 
			[ ],
			"memberDataRefs" : 
			[ ],
			"methods" : 
			[ {
	"name" : "MultiDerived",
	"numBytes" : 0
} ]
		}
	],
	"stats" : 
	{
		"total callbacks" : 14,
		"total classes" : 6,
		"total methods" : 8,
		"total links" : 5,
		"total time" : 2.685849
	}
};
