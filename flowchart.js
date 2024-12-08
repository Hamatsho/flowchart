function removeComments(code) {
	return code.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, "").trim()
}
function isNeed(type) {
	return ["identifier",
		"binary_expression",
		"primitive_type",
		"function_declarator",
		"comment",
	].includes(type)
}
function isFlowchart(type) {
	return ["declaration",
		"assignment_expression",
		"identifier",
		"condition_clause",
		"expression_statement",
		"return_statement",
		"update_expression",
		"binary_expression",
		"parenthesized_expression",
		//this for do while condition
		"field_declaration",
		"continue_statement",
		"statement_identifier",
		"goto_statement",
		"comma_expression",
		"throw_statement",
		"template_parameter_list",
		"field_expression",
	].includes(type);
}
let parser, Lang;
const Parser = window.TreeSitter;
Parser.init().then(async () => {
	parser = new Parser;
	 try {
		Lang = await Parser.Language.load("./tree-sitter-cpp.wasm")
		if (!Lang)
			throw "fail load Language";
	 } catch(e) {
		 alert("Syntax Error in code ");
		dm("Error");
		return;
	}
	parser.setLanguage(Lang)
}).then((d,err) => {
    
	flowchartCpp(defaultValue)

})

async function flowchartCpp(sourceCode, fileName = "") {
	sourceCode = removeComments(sourceCode);
	let tree = await parser.parse(sourceCode)
	const rootNode = await tree.rootNode;
	if (rootNode.hasError) {
		dm("error", "ERROR")
		return;
	}
	

	let nodeData = []
	let linkData = []
	nodeData.push({
		key: "Program",
		header: "Program",
		category: "Program",
		isGroup: true,
	})
	//##############################
	let f = 0;
	let ends = [] // for node that point to null
	let flagEnd = false;
	let textInLine = null;
	let group = "Program";
	//for do while
	let saveStart = false;
	let = startsDo = []; // for do while
	let isCondLoop = false;
	function checkStartDoWhile(key) {
		if (saveStart) {
			startsDo.push(key);
			saveStart = false;
		}
	}

	//end for do while
	function makeNodeData(node) {
		let data = {
			key: node.idNahool,
			text: node.text,
			type: node.type,
			category: "process",
			// default category
			group: group,
			isCondLoop: false,
		};
		if (isCondLoop) {
			data.category = "Conditional";
			data.text = "IF " + data.text
			data.isCondLoop = true;
			isCondLoop = false;
			return data;
		}
		if (node.type == "condition_clause") {
			data.category = "Conditional"
			data.text = "IF " + data.text
		} else if (node.type == "expression_statement" && node.namedChildren[0].type == "binary_expression") {
			data.category = "io"
		}
		return data;
	}

	function makeGroup(key, header = "") {
		if (!key) return {};
		return {
			key: key,
			isGroup: true,
			category: "forLoop",
			group: group,
			header: header,
		}
	}
	function addStartOrEnd(keyGroup, text = "Start") {
		nodeData.push({
			key: keyGroup + text,
			text: text,
			category: "startOrEnd",
			group: keyGroup,
		});
		if (text == "Start")
			f = keyGroup + text;
		else {
			putEnds(keyGroup+text)
		}
	}
	function makeFunction(node) {
		let length = node.namedChildren.length;
		let keyGroup = node.idNahool;

		// is constractor
		if (length == 2) {
			let name = node.namedChildren[0].text;
			nodeData.push(makeGroup(keyGroup, name))
			let body = node.namedChildren[1];
			let tempg = group;
			group = keyGroup;

			print2(body)
			group = tempg;
			return;
		} else if (length !== 3) {
			return;
		}
		let returnType = node.namedChildren[0].text;
		let fname = node.namedChildren[1].namedChildren[0].text;
		let parameters = node.namedChildren[1].namedChildren[1];
		let body = node.namedChildren[2];

		let data = {
			key: keyGroup,
			category: "function",
			isGroup: true,
			group: group,
			returnType: returnType,
			fname: fname,
			parameters: parameters.text.replace(",", " , ")
		};
		nodeData.push(data)
		linkData.push([f, keyGroup, "", "Def"])
		f = keyGroup
		let tempg = group
		let tempf = f;
		f = -1
		group = keyGroup;
		addStartOrEnd(keyGroup)
		print2(body)
		group = tempg
		addStartOrEnd(keyGroup, "End")
		linkData.push([f, keyGroup+"End", "", "end"])
		f = tempf
	}
	//end makeFunction
	//start makeStruct
	function makeStruct(node) {
		let sname = node.namedChildren[0].text;
		let keyGroup = node.idNahool;
		let fields = node.namedChildren[1];
		nodeData.push({
			key: keyGroup,
			isGroup: true,
			group: group,
			header: sname,
			category: "forLoop"
		})
		linkData.push([f, keyGroup, true, "Def"])
		let tempf = f;
		f = -1;
		let tempg = group;
		group = keyGroup;
		print2(fields)
		group = tempg

	}
	let endBreaksSwitch = []
	let currentLoopForContinue = -1;
	let labeledStatements = []; // for goto
	let breaksLoop = []
	function putEnds(currentId) {
		if (flagEnd) {
			if (ends.length > 2) {
				let idEnd = 5000+f;
				nodeData.push({
					key: idEnd, text: "endTest", category: "endBlock", group: group
				})
				ends.forEach((fr) => {
					linkData.push([fr, idEnd, "", null])
				})
				linkData.push([f, idEnd, "g", textInLine])
				f = idEnd;
				textInLine = null;
			} else {
				ends.forEach((fr) => {
					linkData.push([fr, currentId, "", null])
				})
			}
			ends = []
			flagEnd = false
		}
	}
	//for try Catch
	let currentIsTry = false;
	let throws = []
	let currentTry = -1;
	//######
	function print2(node) {
		if (node.type == "function_definition") {
			makeFunction(node)
			return;
		}
		if (node.type == "struct_specifier" || node.type == "class_specifier") {
			makeStruct(node)
			return;
		}
		if (node.type == "if_statement") {
			let cond = node.namedChildren[0]
			let yes = node.namedChildren[1];
			let no = node.namedChildren[2] ? node.namedChildren[2]: null;
			if (flagEnd) {
				if (node.parent.type !== "else_clause") {
					putEnds(cond.idNahool)
				} else flagEnd = false
			}
			checkStartDoWhile(cond.idNahool)
			nodeData.push(makeNodeData(cond))
			//link to condition
			linkData.push([f, cond.idNahool, cond.text, textInLine])
			f = cond.idNahool
			textInLine = "true";
			let tempEndYes = -1;
			if (yes) {
				print2(yes)
				tempEndYes = f;
			}
			textInLine = "false"
			f = cond.idNahool
			if (no !== null) {
				print2(no.firstNamedChild)
			}
			ends.push(tempEndYes)
			flagEnd = true;
		} else //process
			if (isFlowchart(node.type)) {

			checkStartDoWhile(node.idNahool)
			putEnds(node.idNahool)
			nodeData.push(makeNodeData(node))
			linkData.push([f, node.idNahool, "", textInLine])
			f = node.idNahool
			textInLine = null
			if (node.type == "continue_statement") {
				linkData.push([f, currentLoopForContinue, "", "continue"])
				f = -1
			} else
				if (node.type == "statement_identifier") {
				let label = node.text + group;
				let isExistLabel = false;
				labeledStatements.forEach((e) => {
					if (e.name == label) {
						linkData.push([e.key, node.idNahool, "", "goto"])
						isExistLabel = true
					}
				})
				if (!isExistLabel) {
					labeledStatements.push({
						name: label,
						key: f,
					})
				}
			} else
				if (node.type == "goto_statement") {
				let name = node.namedChildren[0].text + group;
				let isExistLabel = false;
				labeledStatements.forEach((e) => {
					if (e.name == name) {
						linkData.push([f, e.key, "", "goto"])
					}
				})
				if (!isExistLabel) {
					labeledStatements.push({
						name: name,
						key: f,
					})
				}
				f = -1
			} else

				//throw_statement
			if (node.type == "throw_statement") {
				if (currentIsTry) {
					throws.push(f)
				} else {
					linkData.push([f, group, "", "throwException"])
				}
				f = -1;

			}

		}
		//Start loop
		else if (node.type == "for_statement") {
			let length = node.namedChildren.length
			if (length != 4) {
				return
			}

			let init = node.firstNamedChild
			let condLoop = node.namedChildren[1];
			let updateLoop = node.namedChildren[2];
			let bodyLoop = node.namedChildren[length -1];
			currentLoopForContinue = updateLoop.idNahool;
			// make group
			let keyGroup = bodyLoop.idNahool;
			nodeData.push(makeGroup(keyGroup, node.text.split("\n")[0]))
			checkStartDoWhile(keyGroup)
			//link to groug
			putEnds(keyGroup)
			linkData.push([f, keyGroup, "", textInLine])
			f = -1
			// make local group
			let localGroupKey = "local"+keyGroup;
			nodeData.push({
				key: localGroupKey,
				isGroup: true,
				group: keyGroup,
				category: "localGroup"
			});
			//end  make local group
			let tempg = group;
			//step 1 init loop
			group = localGroupKey
			if (init) {
				print2(init)
			}
			//step 2 test condLoop
			isCondLoop = true;
			nodeData.push(makeNodeData(condLoop));
			let idCond = condLoop.idNahool;
			linkData.push([f, idCond, "", null])
			f = idCond;
			textInLine = "True";

			//step 3 bodyLoop
			group = keyGroup
			print2(bodyLoop);
			//step 4 updateLoop
			group = localGroupKey
			print2(updateLoop)
			//back to condLoop
			linkData.push([f, idCond, "", null])
			//out from loop
			f = idCond
			textInLine = "false";
			group = tempg;
		}
		//Start While loop
		else if (node.type == "while_statement") {
			let condLoop = node.firstNamedChild;
			let bodyLoop = node.namedChildren[1];
			//make group
			let keyGroup = bodyLoop.idNahool + 5000;
			let tempGroup = keyGroup
			let tempg = group;
			nodeData.push(makeGroup(keyGroup, "While "+condLoop.text));
			//add last link to group while
			checkStartDoWhile(keyGroup)
			putEnds(keyGroup);
			linkData.push([f, keyGroup, "", textInLine])
			f = -1; textInLine = "start"
			group = keyGroup;
			//step 1  condLoop
			isCondLoop = true;
			print2(condLoop)
			let startLoop = f;
			currentLoopForContinue = f;

			//step 2 bodyLoop
			textInLine = "true"
			print2(bodyLoop);
			group = tempGroup
			//flagEnd = true
			//set end links
			putEnds(startLoop)
			linkData.push([f, startLoop, "", textInLine])
			//end set ends link
			f = startLoop
			textInLine = "false"
			group = tempg;
		}
		//Start DoWhile loop
		else if (node.type == "do_statement") {
			let bodyLoop = node.firstNamedChild;
			let condLoop = node.namedChildren[1];
			currentLoopForContinue = condLoop.idNahool;
			//type of condLoop equle "parenthesized_expression" in grammar
			//make group
			let keyGroup = bodyLoop.idNahool + 5000;
			nodeData.push(makeGroup(keyGroup, "Do While " + condLoop.text));
			checkStartDoWhile(keyGroup)
			putEnds(keyGroup);
			linkData.push([f, keyGroup, "", textInLine])
			f = -1
			textInLine = "Start do"
			let tempg = group;
			group = keyGroup;
			//step 1 bodyLoop
			//save firstNamedChild id
			let tempGroup = keyGroup;
			saveStart = true;
			print2(bodyLoop)
			group = tempGroup
			isCondLoop = true;
			print2(condLoop)
			if (startsDo !== []) {
				let start = startsDo.pop()// last element is start for current loop
				linkData.push([f, start, "", "true"])
			} else {
				linkData.push([f, f, "", "Infinity"])
			}
			group = tempg;
			textInLine = "false";
		} else
			if (node.type == "switch_statement") {
			let condSwitch = node.namedChildren[0];
			let bodySwitch = node.namedChildren[1];
			let keyGroup = bodySwitch.idNahool;
			let tempGroup2 = group;
			checkStartDoWhile(keyGroup)
			putEnds(keyGroup)
			//add group switch
			linkData.push([f, keyGroup, "", textInLine])
			textInLine = null
			nodeData.push(makeGroup(keyGroup, "switch " + condSwitch.text));
			group = keyGroup
			//add expressionOfSwitch
			nodeData.push({
				key: condSwitch.idNahool,
				text: "Switch Conditional " + condSwitch.text,
				type: node.type,
				category: "process",
				group: keyGroup,
			})
			f = condSwitch.idNahool
			//test
			let temp = endBreaksSwitch;
			endBreaksSwitch = []
			//end test
			print2(bodySwitch)
			//breaks

			if (true) {
				endBreaksSwitch.push(...ends);
				let idEnd = 5000+f;
				nodeData.push({
					key: idEnd, text: "endTest", category: "endBlock", group: group
				})
				endBreaksSwitch.forEach((fr) => {
					linkData.push([fr, idEnd, node.text, null])
				})
				endBreaksSwitch = temp
				linkData.push([f, idEnd, "g", textInLine])
				flagEnd = false;
				ends = []
				f = idEnd;
				textInLine = null;
			}
			//breaks

			group = tempGroup2;
			//######
		} else if (node.type == "case_statement") {
			let condCase = node.namedChildren[0];
			let caseStatements = node.namedChildren[1];
			let isDefaultCase = false
			if (node.text.slice(0, 7) == "default") {
				isDefaultCase = true
			}
			//add condCase
			nodeData.push({
				key: node.idNahool,
				text: isDefaultCase ? "Default Case ": "case "+ condCase.text,
				type: node.type,
				category: "Conditional",
				group: group
			});
			//add ends
			if (flagEnd) {
				if (node.parent.type !== "else_clause") {
					putEnds(node.idNahool)
				} else flagEnd = false
			}
			//end add ends
			linkData.push([f, node.idNahool, "", textInLine]);
			f = node.idNahool;
			textInLine = "true";
			node.namedChildren.forEach((node, index)=> {
				if (node.text != ";")
					print2(node)
			})
			if (node.lastNamedChild.type != "break_statement")
				ends.push(f)
			textInLine = "false";
			flagEnd = true
			f = node.idNahool;
			if (isDefaultCase) {
				f = -1
			}
		} else //break_statement#######$
			if (node.type == "break_statement") {
			putEnds(node.idNahool)
			nodeData.push(makeNodeData(node))
			linkData.push([f, node.idNahool, "", textInLine])
			textInLine = null
			f = node.idNahool
			if (node.parent.type == "case_statement") {
				endBreaksSwitch.push(f)
				//linkData.push([f, group, "", "stopLoop"])
				//f = -1
			} else {
				linkData.push([f, group, "", "stopLoop"])
				f = -1
			}
		} else if (node.type == "namespace_definition") {
			let name = node.namedChildren[0].text;
			let body = node.namedChildren[1]
			let keyGroup = node.idNahool;
			nodeData.push(makeGroup(keyGroup, "namespace " + name))
			linkData.push([f, keyGroup, "", null])
			f = -1
			let tempg = group;
			group = keyGroup
			print2(body)
			group = tempg
		} else //test
			if (node.type == "try_statement") {
			let tryBody = node.namedChildren[0];
			let tryKey = node.idNahool;
			nodeData.push(makeGroup(tryKey, "Try"))
			linkData.push([f, tryKey, "", textInLine])
			textInLine = null

			f = -1
			flagEnd = true
			putEnds(tryKey)
			let tempg = group;
			group = tryKey;
			currentIsTry = true;
			print2(tryBody)
			currentIsTry = false
			ends.push(f)
			f = -1;
			let tempEnds = ends;
			ends = []
			//
			let idEnd = 800+tryKey
			nodeData.push({
				key: idEnd, text: "endTest", category: "endBlock", group: group, type: "endThrow"
			})
			throws.forEach((fr)=> {
				linkData.push([fr, idEnd, "", "throwException"])
			})
			throws = []
			currentTry = idEnd
			//process catch
			node.namedChildren.shift() //delete try body
			node.namedChildren.forEach((node)=> {
				print2(node)
			})

			group = tempg
			ends.push(...tempEnds)

			flagEnd = true;
		} else //Catch
			if (node.type == "catch_clause") {
			let catchKey = node.idNahool;
			let text = "catch " + node.namedChildren[0].text;
			nodeData.push(makeGroup(catchKey, text))
			linkData.push([currentTry, catchKey, "", "handel"])
			let catchBody = node.namedChildren[1];
			let tempg = group;
			group = catchKey;
			print2(catchBody)
			ends.push(f)
			f = -1
			group = tempg;
		} /*else if(node.type == "throw_statement") {
			}*/
		else
			node.namedChildren.forEach((child, i) => {
			if (!isNeed(child.type)) {
				print2(child);
			}
		});
		return;
	}
	//##########################
	print2(tree.rootNode);
    function makeLinksData() {
		let newLinkData = []
		linkData.forEach((el) => {
			let from = el[0],
			to = el[1],
			text = el[3];
			if (from != -1) {
				let color = "#fdb71c";

				if (text == "throwException" || text == "false") {
					color = "red"
				} else if (text == "continue" || text == "handel") {
					color = "#1CA200"
				} else if (text == "stopLoop") {
					color = "#C12800"
				}
				newLinkData.push({
					from: from,
					to: to,
					text: text,
					dashLink: text == "Def"? true: false,
					color: color,
				})
			}
		})

		return newLinkData;
	}
	let newLinkData = makeLinksData();

	makeFlowchart(nodeData,newLinkData)
	//#############
	
	return {
		fileName: fileName,
		modelData: [nodeData, newLinkData]
	};


}//end preProcessing




