var ROOT;
var filesystem;

function exists(id) {
	return filesystem.hasOwnProperty(id);
}
function getChildren(id) {
	var children = [];
	$.each(filesystem[id].children, function(index, value) {
		children.push(filesystem[value]);
	});
	return children;
}

function getParent(id) {
	if (!filesystem[id].parent) {
		return filesystem[id];
	}
	return filesystem[filesystem[id].parent];
}
function setFolder(id) {
	var id = id || ROOT;
	if (!exists(id)) {
		return;
	}
	if (filesystem[id].type != "folder") {
		return;
	}
	RenderBreadCrumbPath(id);
   	displayList(id, getChildren(id));

}
function el(name, options) {
	var el = document.createElement(name);
	if (!options) {
		return el;
	}
	if (options.id) {
		el.id = options.id;
	}
	if (options.class) {
		el.className = options.class;
	}
	if (options.html) {
		el.innerHTML = options.html;
	}
	$.each(options, function(key, value) {
		el.setAttribute(key, value);
	});
	return el;
}

$(document).ready(function() {
	var query = $.get("/filesystem")
	.done(function(data, status){
		ROOT = null;		
		filesystem = JSON.parse(data)['sent'];		
		$.each(filesystem, function(key, fileinfo) {
			 // iterate over files to find the root node
			if (fileinfo['parent'] === 'null') {												
				ROOT = key;					
				return false;
			}
		});
	renderSidebarTree("mazen"); 
	renderTraceTree("cad1"); 		
	}).fail(function(data){
		filesystem = null;
		ROOT = null;		
	}).always(function(data){
		setFolder(ROOT);		
	});
});