"use strict";

let textplot = Bokeh.Plotting.figure({title:'Map Bits to XY', toolbar_location: null,
    height: 300, width: 500, sizing_mode: "scale_both", x_range: [0, 256], y_range: [256, 0]});
textplot.xgrid.band_fill_alpha = 0.1;
textplot.xgrid.band_fill_color = "navy";
textplot.ygrid.band_fill_alpha = 0.1;
textplot.ygrid.band_fill_color = "navy";
textplot.xaxis.ticker = new Bokeh.FixedTicker({ticks: [0,128,256]});
textplot.yaxis.ticker = new Bokeh.FixedTicker({ticks: [0,128,256]});
textplot.xgrid.ticker = new Bokeh.FixedTicker({ticks: [0,128,256]});
textplot.ygrid.ticker = new Bokeh.FixedTicker({ticks: [0,128,256]});

let textglyph = textplot.text({x:[],y:[],text:[], text_align: 'center' ,text_baseline:'middle'});
let textsource = textglyph.data_source;

let lineglyph = textplot.segment({x0:[], x1:[], y0:[], y1:[]});
let linesource = lineglyph.data_source;


// show the plot when we are ready
let step = 0;

function interleave(x,y) {
    let z = 0;
    for (let i=0; i<8; i++){
        z |= (x & 1 << i) << i | (y & 1 << i) << (i + 1);
    }
    return z;
}
function leading_zeros(z) {
    let i=0;
    for (; i<16 && z >> (15-i) == 0 ; i++){}
    return i
}


let z = [];
function mapXY() {
    let xn = 2**(1 + Math.floor(step / 2));
    let yn = 2**(1 + Math.floor((step - 1) / 2));

    textsource.data.x = [];
    textsource.data.y = [];
    textsource.data.text = [];
    for (let x=0; x<xn; x++){
    for (let y=0; y<yn; y++){
	let z = (step % 2 == 0) ? interleave(x,y) : interleave(y,x);
        let ztext = (z).toString(2).padStart(step+1,'0').padEnd(8,'X');
        textsource.data.x.push(256*(x*2+1)/(xn*2));
        textsource.data.y.push(256*(y*2+1)/(yn*2));
        textsource.data.text.push(ztext)
    }}
    // adjust the grid
    textplot.xgrid.ticker = new Bokeh.FixedTicker({ticks: Array.from( new Array(xn + 1), (x, i) => 256*i/(xn))});
    textplot.ygrid.ticker = new Bokeh.FixedTicker({ticks: Array.from( new Array(yn + 1), (x, i) => 256*i/(yn))});
    //textplot.title.text = "Map Bits to XY" + step;
    
    textsource.change.emit();
    adjust_fontsize();
}

function adjust_fontsize() {
    let xn = 2**(1 + Math.floor(step / 2));
    textglyph.glyph.text_font_size = Math.round(textplot.layout_width / (xn*8)) + "pt";
}

// Create the matrix
let kmatrix = [];
for (let y=0; y<2**8; y++) {
    kmatrix.push(Array(256));
    for (let x=0; x<2**8; x++) {
        kmatrix[y][x] = leading_zeros(interleave(y, x));
    }
}
    

let kmatrixplot = Bokeh.Plotting.figure({title:'k-matrix', toolbar_location: null, height: 300, width: 500,
    x_range: [0,256], y_range: [0,256], sizing_mode: "scale_both"});


let colorPalette =  [0x1f77b4, 0xaec7e8, 0xff7f0e, 0xffbb78, 0x2ca02c, 0x98df8a, 0xd62728, 0xff9896, 0x9467bd, 0xc5b0d5,
                               0x8c564b, 0xc49c94, 0xe377c2, 0xf7b6d2, 0x7f7f7f, 0xc7c7c7, 0xbcbd22, 0xdbdb8d, 0x17becf, 0x9edae5];

let colorMapper = new Bokeh.CategoricalColorMapper({palette: colorPalette,
     factors:Array.from(colorPalette.keys())});

let imageData = kmatrixplot.image({image:[kmatrix.reverse(),], x:0, y:0,
    dw:256,dh:256, color_mapper: colorMapper});
let kmatrixsource = imageData.data_source;
let kmatrixcircles = kmatrixplot.circle({x:[], y:[],size:20, color:"white", alpha:0.9});


let kseen = Array(16).fill(0);
function add_value(){
    let x = Math.floor(Math.random()*256);
    let y = Math.floor(Math.random()*256);
    let k = kmatrix[y][x];
    //kmatrixsource.data.image[0][x][y] = null;
    //kmatrixsource.change.emit();
    kmatrixcircles.data_source.data.x.push(x);
    kmatrixcircles.data_source.data.y.push(y);
    kmatrixcircles.data_source.change.emit();
    console.log(k);
    kseen[k]++;
    update_table();
}

function create_table() {
    let table_body = document.getElementById('hit_table').children[0];
    for (let row=0; row<kseen.length; row++){
        let newrow = table_body.insertRow(row);
        let cell1 = newrow.insertCell(0);
        cell1.style.backgroundColor = "#" + colorPalette[row].toString(16);
        let cell1_text = document.createTextNode(row);
        cell1.appendChild(cell1_text);
        newrow.insertCell(1);
    }
    update_table();
}
// Table
function update_table(){
    let table = document.getElementById('hit_table');
    for (let row=0; row<kseen.length; row++){
        table.rows[row].cells[1].innerText = kseen[row];
    }
}

// k=7

let k7plot = Bokeh.Plotting.figure({toolbar_location: null, height: 300, width: 500, x_range:[1, 1000], sizing_mode: "scale_both"});
k7plot.xaxis.axis_label_text_font_size = "20pt";
k7plot.xaxis.major_label_text_font_size = "20pt";
k7plot.yaxis.major_label_text_font_size = "20pt";
let Nrange = Array.from(Array(1000).keys());
let k7values = Nrange.map((val) => {return (1-2**(-7))**val - (1-2**(-6))**val});
k7plot.line({x:Nrange, y:k7values, line_width:5});
k7plot.xaxis.axis_label = 'N';


// N=1000

let N1000plot = Bokeh.Plotting.figure({toolbar_location: null, height: 30, width: 50, sizing_mode: "scale_both"});
N1000plot.xaxis.axis_label_text_font_size = "20pt";
N1000plot.xaxis.major_label_text_font_size = "20pt";
N1000plot.yaxis.major_label_text_font_size = "20pt";
let Krange = Array.from(new Array(1000), (x, i) => 0.1+i/25);
let N1000values = Krange.map((val) => {return (1-2**(-val))**1000 - (1-2**(1-val))**1000});
N1000plot.line({x:Krange, y:N1000values, line_width: 5});
N1000plot.xaxis.axis_label = 'k';


    
mapXY();

// show the plots and bind the buttons, when we are ready
head.ready(() => {
    Bokeh.Plotting.show(textplot,document.getElementById("mapXY"));
    Bokeh.Plotting.show(kmatrixplot,document.getElementById('kmatrix'));
    Bokeh.Plotting.show(k7plot,document.getElementById('k7'));
    Bokeh.Plotting.show(N1000plot,document.getElementById('N1000'));

    create_table();

    let mapXYSlider = document.getElementById("mapXYSlider");
    mapXYSlider.addEventListener("input", () => {step = parseInt(mapXYSlider.value, 10); mapXY();})
    mapXYSlider.value=0;
    window.addEventListener("resize", adjust_fontsize);
    document.getElementById("kmatrixadd").addEventListener("click", add_value);
})
// vim: ts=4:sw=4:expandtab 
