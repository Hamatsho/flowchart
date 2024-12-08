const $ = go.GraphObject.make;
function mainLayout() {
	return new go.TreeLayout({ 
			  angle: 90,
			  nodeSpacing: 200,
			  layerSpacing: 50,
			  setsPortSpot: false,
			  setsChildPortSpot: false,
			  layerStyle: go.TreeLayerStyle.Uniform,
		});	
}
const diagram = $(go.Diagram, "flowchart", {
  layout: mainLayout(),
});
//######
go.Shape.defineFigureGenerator("Parallelogram", function(shape, w, h) {
            const param1 = shape ? shape.parameter1 || 0.1 : 0.1; // 
            const dx = Math.min(w * param1, w / 2);
            return new go.Geometry()
                .add(new go.PathFigure(dx, 0)  // first point
                    .add(new go.PathSegment(go.PathSegment.Line, w, 0))       // top line 
                    .add(new go.PathSegment(go.PathSegment.Line, w - dx, h)) //  right line
                    .add(new go.PathSegment(go.PathSegment.Line, 0, h))      // bottom line 
                    .add(new go.PathSegment(go.PathSegment.Line, dx, 0))     // left line
                );
        });
          // define some custom shapes for node templates

  function defineFigures() {

    go.Shape.defineFigureGenerator('Conditional', (shape, w, h) => {
      const geo = new go.Geometry();
      const fig = new go.PathFigure(w * 0.15, 0, true);
      geo.add(fig);
      fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.85, 0));
      fig.add(new go.PathSegment(go.SegmentType.Line, w, 0.5 * h));
      fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.85, h));
      fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.15, h));
      fig.add(new go.PathSegment(go.SegmentType.Line, 0, 0.5 * h).close());
      geo.spot1 = new go.Spot(0.15, 0);
      geo.spot2 = new go.Spot(0.85, 1);
      return geo;
    });

    // taken from ../extensions/Figures.js:
    go.Shape.defineFigureGenerator('File', (shape, w, h) => {
      const geo = new go.Geometry();
      const fig = new go.PathFigure(0, 0, true); // starting point
      geo.add(fig);
      fig.add(new go.PathSegment(go.SegmentType.Line, 0.75 * w, 0));
      fig.add(new go.PathSegment(go.SegmentType.Line, w, 0.25 * h));
      fig.add(new go.PathSegment(go.SegmentType.Line, w, h));
      fig.add(new go.PathSegment(go.SegmentType.Line, 0, h).close());
      const fig2 = new go.PathFigure(0.75 * w, 0, false);
      geo.add(fig2);
      // The Fold
      fig2.add(new go.PathSegment(go.SegmentType.Line, 0.75 * w, 0.25 * h));
      fig2.add(new go.PathSegment(go.SegmentType.Line, w, 0.25 * h));
      geo.spot1 = new go.Spot(0, 0.25);
      geo.spot2 = go.Spot.BottomRight;
      return geo;
    });
  }
defineFigures()
//######
const colors =  {
        text: '#fff',
        step: '#414a8d',
        conditional: '#88afa2',
        comment: '#bfb674',
        bgText: '#fff',
        link: '#fdb71c',
        linkOver: '#475569',
        div: '#141e37'
      }
diagram.groupTemplateMap = new go.Map()
diagram.nodeTemplateMap = new go.Map()
function shapeStyle(shape) {
      // make the whole node shape a port
      shape.set({ strokeWidth: 0, portId: '', cursor: 'pointer' });
    }
function textStyle(textblock) {
      textblock.set({
      	font: 'bold 11pt Figtree, sans-serif',
      	  maxSize: new go.Size(170, NaN),
        wrap: go.Wrap.Fit,
        textAlign: 'center',
      })
      //.theme('stroke', 'text');
    }
const startOrEndTemplate =
		$(go.Node,'Auto',
          $(go.Shape,'Capsule', { 
	          	fromLinkable: true,
	          	fill:"#005DFF",
	          	strokeWidth:0
          }).bind("fill","text",(t) => t == "End" ? "red":"#5C00FF"),
         
          //.apply(shapeStyle).theme('fill', 'start'),
          $(go.TextBlock,'Start', { 
          	margin: new go.Margin(3, 3),
        	stroke:"white"
          	}).apply(textStyle).bind('text')
        )
  diagram.nodeTemplateMap.add("startOrEnd",startOrEndTemplate)
    

//###########################$###########$$

const mainGroupTemplate = new go.Group('Vertical', {
	//layout:mainLayout(),
	initialAutoScale: go.AutoScale.UniformToFill,
	defaultStretch: go.Stretch.Horizontal,
//	fromSpot: go.Spot.RightSide,
//	toSpot: go.Spot.TopSide,
})
//Group Label
.add(
	$(go.Panel, 'Auto',
		$(go.Shape, 'RoundedTopRectangle', {
			fill: '#000',
			stroke: "white",
		}),
		$(go.TextBlock, {
			margin: new go.Margin(2, 2, 0, 2),
			textAlign: 'center',
			stroke:"white",
		}).bind('text', 'header')
	),
	$(go.Panel, 'Auto',
		$(go.Shape, "RoundedBottomRectangle", {
			fill: '#000',
			stroke: "white",
		}),
		$(go.Placeholder, {
			padding: 5
		}),
	),
);
//for loops

const groupTemplate = 
new go.Group('Vertical', {
layout: mainLayout(),
	initialAutoScale: go.AutoScale.UniformToFill,
	defaultStretch: go.Stretch.Horizontal,

})
.add(
	$(go.Panel, 'Auto',{
		defaultStretch: go.Stretch.Horizontal
	},
		$(go.Shape, 'RoundedTopRectangle', {
			fill: '#eee',
			stroke: "white",
		}),
		//header
			$(go.Panel, "Table",
				$(go.TextBlock, "header", {
					column: 0, row: 0,
					alignment: go.Spot.Left,
					margin: new go.Margin(0, 15, 0, 0),
					
				}).apply(textStyle).bind("text", "header"),
				go.GraphObject.build("SubGraphExpanderButton", {
					column: 1, row: 0,
				})
			),
	),
	$(go.Panel, 'Auto',
		$(go.Shape, "RoundedBottomRectangle", {
			fill: '#333',
			stroke: "white",
		}),
		$(go.Placeholder, {
			padding: 20
		}),
	),
);

//Start localGroup for loop
const localGroupTemplate = 
new go.Group('Horizontal', {
	layout: new go.GridLayout({
		wrappingColumn: 3,
		spacing: new go.Size(30, 5)
	})
})
.add(
	$(go.Panel, 'Auto',
		$(go.Shape, "RoundedBottomRectangle", {
			fill: 'transparent',
			stroke: "white",
			strokeWidth:0.5
		}),
		$(go.Placeholder, {
			padding: 0
		}),
	),
);
//End localGroup for loop

//functionTemplate
const functionTemplate = 
new go.Group('Vertical', {
layout: mainLayout(),
	initialAutoScale: go.AutoScale.UniformToFill,
	defaultStretch: go.Stretch.Horizontal,
})
.add(
	$(go.Panel, 'Auto',{
		defaultStretch: go.Stretch.Horizontal
	},
		$(go.Shape, 'RoundedTopRectangle', {
			fill: "#fff",
			stroke: "white",
		}),
		//header
			$(go.Panel, "Table",
			$(go.Panel,"Horizontal",{
				column:0,row:0,
			},
				$(go.TextBlock,"returnType",{
				//	column:0,row:0,
					margin: new go.Margin(0, 10, 0, 0),
					stroke:"red"
				}).apply(textStyle)
				  .bind("text","returnType"),
				  //name
				 $(go.TextBlock,"fname",{
				//	column:1,row:0,
					margin: new go.Margin(0, 10, 0, 0),
					stroke:"black"
				}).apply(textStyle)
				  .bind("text","fname"),
				  //parameters
				  $(go.TextBlock,"parameters",{
				//	column:2,row:0,
					margin: new go.Margin(0, 10, 0, 0),
					stroke:"black"
				}).apply(textStyle).bind("text","parameters"),
				  
			),
				go.GraphObject.build("SubGraphExpanderButton", {
					column: 1, row: 0,
				})
			),
	),
	$(go.Panel, 'Auto',
		$(go.Shape, "RoundedBottomRectangle", {
			fill: '#333',
			stroke: "white",
		}),
		$(go.Placeholder, {
			padding: 20
		}),
	),
);
//End functionTemplate
diagram.groupTemplateMap.add("forLoop", groupTemplate);
diagram.groupTemplateMap.add("localGroup", localGroupTemplate);

diagram.groupTemplateMap.add("Program", mainGroupTemplate);
diagram.groupTemplateMap.add("function", functionTemplate);

//#######$$$$$########
const linkTemplate = $(go.Link, {
//	routing: go.Routing.AvoidsNodes,
//	corner: 7,
//	curve: go.Curve.JumpOver,
	//	curve: go.Curve.Bezier//borderRuduce for link
	routing: go.Routing.AvoidsNodes,
    curve: go.Curve.JumpOver,
    //curve: go.Curve.Bezier,
    corner: 8,
     // toShortLength: 4,
	reshapable: true,
    resegmentable: true,
    fromSpot: go.Spot.AllSides,
    toSpot: go.Spot.AllSides,
},
	$(go.Shape, {
		stroke: "#00FF59",
		strokeDashArray:[5,0],
			strokeWidth: 3,
			stroke:colors.link
	}).bind("stroke","color")
	.bind("strokeDashArray","dashLink",(d) => d ? [2,4] : [5,0]),
//arrow head
	$(go.Shape, {
		toArrow: "standard",
		fill:colors.link
	}).bind("fill","color")
	
	.bind("stroke","color"),
	$(go.TextBlock,"",{
		stroke:"white"
	}).bind("text","text",(t) => t ? t: "")
);



diagram.linkTemplate = linkTemplate;


const nodeTemplate = $(go.Node,"Auto",{
	fromSpot: go.Spot.AllSides,
	toSpot: go.Spot.AllSides,
},
	$(go.Shape,"Rectangle",{
		strokeWidth:0,
		fill:"#005DFF"
	}).bind("fill","type",(type) => {
		if(type == "break_statement" || type== "throw_statement")
			return "#9B0A00"; else
		if(type == "continue_statement")
			return "#1CA200"; else
		if(type == "statement_identifier" || type == "goto_statement")
			return "#FF00FF"; 
			else
		return "#005DFF"
		
	}).bind("figure","type",(t) => {
		if(t == "statement_identifier" || t == "goto_statement") {
			return "SquareArrow";
		} else{
			return "Rectangle"
			}
	}),
	$(go.TextBlock,"text",{
		margin: new go.Margin(10, 10),
        stroke:"white"
	}).apply(textStyle)
	.bind("text","text")
	.bind("margin","type",(t) => {
	if(t == "statement_identifier" || t == "goto_statement"){
		return new go.Margin(5,0,5,5) ;
		} else return new go.Margin(10,10)
	})
)

//diagram.nodeTemplate = nodeTemplate;
diagram.nodeTemplateMap.add("process",nodeTemplate)
diagram.nodeTemplateMap.add("Conditional",
	$(go.Node,"Auto",{
	fromSpot: go.Spot.AllSides,
	toSpot: go.Spot.AllSides,
},
	$(go.Shape,"Conditional",{
		fill:"#6a9a8a",
	}).apply(shapeStyle)
	  .bind("fill","isCondLoop",(isCondLoop) => isCondLoop ? "#B35000": "#6a9a8a"),
	$(go.TextBlock,"text",{
		stroke:"white",
		margin: 8,
        
	}).apply(textStyle)
	.bind("text","text")
));
//start endBlockTemplate
diagram.nodeTemplateMap.add("endBlock",
	$(go.Node,"Auto",{
	},
	$(go.Shape,"Circle",{
		fill:"white",
	}).apply(shapeStyle)
	.bind("fill","type",(t)=> {
		if(t == "endThrow")
		return "#1CA200"
	}),
	$(go.TextBlock,"end",{
		stroke:"white",
		margin:5,
	}).bind("text","type",(t)=> {
		if(t == "endThrow")
		return "Exp"
	})
));

diagram.nodeTemplateMap.add("io",
	$(go.Node,"Auto",{
	//fromSpot: go.Spot.BottomSide,
	//toSpot: go.Spot.AllSides,
},
	$(go.Shape,"Parallelogram",{
		fill:"#009DFF",
	stroke:"transparent"
	}),
	$(go.TextBlock,"text",{
		stroke:"white",
		margin: new go.Margin(10,20),
	}).apply(textStyle).bind("text","text")
));

diagram.model = new go.GraphLinksModel([], [], {
	//this Attribute for can use link key
	linkKeyProperty: "key"
})
function makeFlowchart(nodeDataArray,linkDataArray) {
	diagram.model.nodeDataArray = nodeDataArray;
	diagram.model.linkDataArray = linkDataArray ;
	
}
dm("developed by Hamatsho");