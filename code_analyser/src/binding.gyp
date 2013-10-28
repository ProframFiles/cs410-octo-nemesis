{	
	"targets": [{
		"target_name": "hello",
		"sources": [ "analyzer.cpp" ],
		'conditions': [
			['OS=="win"', {
				'cflags': [
				'/WX',
				],
			}, 
			{ # OS != "win"
				'cflags': 
				 [ '-std=c++0x'],
			}],
			],
		'variables': {
		"llvm_src_dir" : '../llvm/',
		"clang_src_dir" : '../llvm/tools/clang/',
		"llvm_build_dir" : '../build/',
		"llvm_lib_dir" : '../../build/lib/'
		},
		'include_dirs': 
			[ '<(llvm_src_dir)include', '<(clang_src_dir)include', '<(llvm_build_dir)include', '<(llvm_build_dir)tools/clang/include' ],
		'link_settings': {
			'libraries': 
				[ '-lrt -ldl -lz <(llvm_lib_dir)libclangEdit.a <(llvm_lib_dir)libclangTooling.a <(llvm_lib_dir)libclangBasic.a <(llvm_lib_dir)libclangAST.a <(llvm_lib_dir)libclangASTMatchers.a <(llvm_lib_dir)libclangRewriteFrontend.a <(llvm_lib_dir)libclangFrontend.a <(llvm_lib_dir)libclangDriver.a <(llvm_lib_dir)libLLVMOption.a <(llvm_lib_dir)libclangSerialization.a <(llvm_lib_dir)libLLVMBitReader.a <(llvm_lib_dir)libclangRewriteCore.a <(llvm_lib_dir)libclangParse.a <(llvm_lib_dir)libclangSema.a <(llvm_lib_dir)libclangEdit.a <(llvm_lib_dir)libLLVMAArch64AsmParser.a <(llvm_lib_dir)libLLVMAArch64Disassembler.a <(llvm_lib_dir)libLLVMARMCodeGen.a <(llvm_lib_dir)libLLVMARMAsmParser.a <(llvm_lib_dir)libLLVMARMDisassembler.a <(llvm_lib_dir)libLLVMCppBackendCodeGen.a <(llvm_lib_dir)libLLVMHexagonCodeGen.a <(llvm_lib_dir)libLLVMMipsCodeGen.a <(llvm_lib_dir)libLLVMMipsAsmParser.a <(llvm_lib_dir)libLLVMMipsDisassembler.a <(llvm_lib_dir)libLLVMMSP430CodeGen.a <(llvm_lib_dir)libLLVMNVPTXCodeGen.a <(llvm_lib_dir)libLLVMPowerPCCodeGen.a <(llvm_lib_dir)libLLVMPowerPCAsmParser.a <(llvm_lib_dir)libLLVMR600CodeGen.a <(llvm_lib_dir)libLLVMSparcCodeGen.a <(llvm_lib_dir)libLLVMSystemZCodeGen.a <(llvm_lib_dir)libLLVMSystemZAsmParser.a <(llvm_lib_dir)libLLVMSystemZDisassembler.a <(llvm_lib_dir)libLLVMX86CodeGen.a <(llvm_lib_dir)libLLVMX86AsmParser.a <(llvm_lib_dir)libLLVMX86Disassembler.a <(llvm_lib_dir)libLLVMXCoreCodeGen.a <(llvm_lib_dir)libLLVMXCoreDisassembler.a <(llvm_lib_dir)libLLVMAsmParser.a <(llvm_lib_dir)libLLVMAArch64CodeGen.a <(llvm_lib_dir)libLLVMARMDesc.a <(llvm_lib_dir)libLLVMCppBackendInfo.a <(llvm_lib_dir)libLLVMHexagonAsmPrinter.a <(llvm_lib_dir)libLLVMMipsDesc.a <(llvm_lib_dir)libLLVMMSP430Desc.a <(llvm_lib_dir)libLLVMNVPTXDesc.a <(llvm_lib_dir)libLLVMPowerPCDesc.a <(llvm_lib_dir)libLLVMR600Desc.a <(llvm_lib_dir)libLLVMSparcDesc.a <(llvm_lib_dir)libLLVMSystemZDesc.a <(llvm_lib_dir)libLLVMX86Desc.a <(llvm_lib_dir)libLLVMXCoreDesc.a <(llvm_lib_dir)libLLVMAArch64Desc.a <(llvm_lib_dir)libLLVMAsmPrinter.a <(llvm_lib_dir)libLLVMSelectionDAG.a <(llvm_lib_dir)libLLVMARMAsmPrinter.a <(llvm_lib_dir)libLLVMARMInfo.a <(llvm_lib_dir)libLLVMHexagonDesc.a <(llvm_lib_dir)libLLVMMipsAsmPrinter.a <(llvm_lib_dir)libLLVMMipsInfo.a <(llvm_lib_dir)libLLVMMSP430AsmPrinter.a <(llvm_lib_dir)libLLVMMSP430Info.a <(llvm_lib_dir)libLLVMNVPTXAsmPrinter.a <(llvm_lib_dir)libLLVMNVPTXInfo.a <(llvm_lib_dir)libLLVMPowerPCAsmPrinter.a <(llvm_lib_dir)libLLVMPowerPCInfo.a <(llvm_lib_dir)libLLVMR600AsmPrinter.a <(llvm_lib_dir)libLLVMR600Info.a <(llvm_lib_dir)libLLVMSparcInfo.a <(llvm_lib_dir)libLLVMSystemZAsmPrinter.a <(llvm_lib_dir)libLLVMSystemZInfo.a <(llvm_lib_dir)libLLVMX86AsmPrinter.a <(llvm_lib_dir)libLLVMX86Info.a <(llvm_lib_dir)libLLVMXCoreAsmPrinter.a <(llvm_lib_dir)libLLVMXCoreInfo.a <(llvm_lib_dir)libLLVMAArch64AsmPrinter.a <(llvm_lib_dir)libLLVMAArch64Info.a <(llvm_lib_dir)libLLVMMCParser.a <(llvm_lib_dir)libLLVMCodeGen.a <(llvm_lib_dir)libLLVMHexagonInfo.a <(llvm_lib_dir)libLLVMX86Utils.a <(llvm_lib_dir)libLLVMAArch64Utils.a <(llvm_lib_dir)libLLVMObjCARCOpts.a <(llvm_lib_dir)libLLVMScalarOpts.a <(llvm_lib_dir)libLLVMInstCombine.a <(llvm_lib_dir)libLLVMTransformUtils.a <(llvm_lib_dir)libLLVMipa.a <(llvm_lib_dir)libLLVMAnalysis.a <(llvm_lib_dir)libLLVMTarget.a <(llvm_lib_dir)libLLVMCore.a <(llvm_lib_dir)libclangAnalysis.a <(llvm_lib_dir)libclangAST.a <(llvm_lib_dir)libclangLex.a <(llvm_lib_dir)libclangBasic.a <(llvm_lib_dir)libLLVMMC.a <(llvm_lib_dir)libLLVMObject.a <(llvm_lib_dir)libLLVMSupport.a'],
			'library_dirs': 
			[ '/usr/lib', ],
		},
		}
	]
}
