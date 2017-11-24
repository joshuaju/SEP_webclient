//calle
//Returns an array [[ID, FileInPath], ...] containing the steps necessary to reach root from 'startID'
function findPathToRoot(startID, inputFileSystem) {
	var currFile = inputFileSystem[startID];
	var path = [
		[startID, currFile]
	];
	while (currFile["parent"] != null) {
		var nextID = currFile["parent"];
		currFile = inputFileSystem[nextID];
		path.unshift([nextID, currFile]);
	}
	return path;
}
//Draws the breadcrumb with the given path. INPUT FORMAT: [[RootID, RootFile], ... , [LastID, LastFile]]
function RenderBreadCrumbPath(id) {
	var holder = $("#breadcrumb");
	$(holder).empty();
	breadcrumbs = [];
	var currentFolder = id;
	while (currentFolder != ROOT) {
		var breadcrumb = el("div", {
			"class": "custom-breadcrumb btn btn-xs non-root-crumb",
			"data-id": currentFolder
		});
		var span = el("span", {
			html: filesystem[currentFolder].name
		});
		breadcrumb.appendChild(span);
		breadcrumb.oncontextmenu = function(e) {
			MoveDropdownItemsToElement(this);
			e.preventDefault();
		}
		breadcrumbs.unshift(breadcrumb);
		currentFolder = getParent(currentFolder).id;
	}
	//Remove the root
	//breadcrumbs.shift();
	$.each(breadcrumbs, function(key, value) {
		holder.append(value);
	});
}

function MoveDropdownItemsToElement(inputElement) {
	createDropdownMenu(inputElement);
	var rect = inputElement.getBoundingClientRect();
	var recycledDropdown = document.getElementById('breadcrumb-dropdown');
	recycledDropdown.style.left = (rect.left) + "px";
	recycledDropdown.style.top = (rect.bottom) + "px";
	if (recycledDropdown.childElementCount > 0) recycledDropdown.style.display = "block";
	else recycledDropdown.style.display = "none";
}

function createDropdownMenu(elem) {
	var id = elem.getAttribute('data-id');
	var newElem = [];
	$.each(getChildren(id), function(key, value) {
		if (value.type != "folder") {
			return;
		}
		var listTag = el("li", {
			"class": "dropdown-element",
			"data-id": value.id
		});
		var tag = el("a", {
			"href": "#",
			html: value.name
		});
		listTag.appendChild(tag);
		newElem.push(listTag);
	});
	var holder = $("#breadcrumb-dropdown");
	$(holder).empty();
	$.each(newElem, function(key, value) {
		holder.append(value);
	});
}

function HideDropdownElement() {
	var recycledDropdown = document.getElementById('breadcrumb-dropdown');
	recycledDropdown.style.display = "none";
}

function CreateSearchCrumb(searchTerm) {
	var holder = $("#breadcrumb");
	$(holder).empty();
	var breadcrumb = el("div", {
		"class": "custom-breadcrumb btn btn-xs non-root-crumb",
		"data-id": ROOT
	});
	var span = el("span", {
		html: "\"" + searchTerm + "\""
	});
	breadcrumb.appendChild(span);
	holder.append(breadcrumb);
}
function handle_upload(upload_type) {
	var fileInput = $('#file-input');
	data = new FormData();
	request = new XMLHttpRequest();
	/*var notify = $.notify('<strong>Uploading</strong>', {
		type: 'success',
		allow_dismiss: false,
		showProgressbar: true
	});*/
	for (var i = 0; i < fileInput.prop("files").length; ++i){
		data.append('file', fileInput.prop("files")[i]);
	}
	data.append('upload-type', $("#file-input").attr("data-type"));
	$("#file-input").attr("data-type", "");
	data.append('ajax', true);
	data.append('folder', getFolder());
	request.upload.addEventListener('progress', function(event) {
		// If the event can be calculated.
		if(event.lengthComputable) {
			var percent = Math.round((event.loaded / event.total) * 100);
			//notify.update('progress', percent);
		}
	});
	request.upload.addEventListener('load', function(event){
		//m.redraw(true);
	});
	request.upload.addEventListener('error', function(event){
		alert("There has been an error");
	});
	request.addEventListener('readystatechange', function(event) {
		if(this.readyState == 4) {
			if(this.status == 200) {
				
				refreshFilesystem();
			} else {
				// Log response status
			}
		}
	});
	request.open('post', 'upload');
	// Overwrite any cache control in the browser.
	request.setRequestHeader('Cache-Control', 'no-cache');
	request.send(data);
}
$(document).ready(function() {
	$("#search-btn").click(function() {
		$("#searchModal").modal("show");
	});
	$("#advanced-search-btn").click(function() {
		var searchJSON = {};
		$(".search-query").each(function() {
			var type = $(this).find(".select-type").val();
			var value = $(this).find(".search-expression").val();
			searchJSON[type]= value;
		});
		$.ajax({
			url:"/search",
			dataType:"JSON",
			method:"POST",
			data:{"matchall":$("#match-all").is(":checked") ? 1 : 0, "json":JSON.stringify(searchJSON)},
			success:function(data) {
				if (!data.success) {
					alert("could not complete search");
					return;
				}
				$("#searchModal").modal("hide");
				fileObjects = [];
				$.each(data.fileIds, function(key, value){
					fileObjects.push(filesystem[value]);
				});
				CreateSearchCrumb("[Custom]");
				displayList(null, fileObjects);
			}
		})
	});
	$(document).click(function() {
		HideDropdownElement();
	});
	$(".upload-btn").click(function() {
		$("#file-input").attr("data-type", $(this).attr("data-type")).click();
	});
	$("#upload-folder-btn").click(function() {
		$("#folder-input").click();
	});
	$("#new-folder-btn").click(function() {
		var name = prompt("Name of new folder:");
		if (!name) {
			return;
		}
		$.ajax({
			url:"/newFolder",
			method:"POST",
			dataType:"JSON",
			data:{"parent":getFolder(), "name":name},
			success: function(data) {
				if (!data.success) {
					alert("Could not create new folder");
					return;
				}
				refreshFilesystem();
			}
		});	
	});
	$("#file-input").on("change", function() {
		handle_upload();
	});
	$("#folder-input").on("change", function() {
		handle_upload();
	});
	//navtree is clicked
	$("#fileview").on("click", ".selectable", function(e) {
		var dataId = this.getAttribute("data-id");
		setFolder(dataId);
	});
	//root folder is clicked
	$("#root-nav").on("click", function() {
		setFolder(ROOT);
	});
	//root folder is clicked
	$("#breadcrumb").on("click", ".non-root-crumb", function() {
		setFolder(this.getAttribute("data-id"));
	});
	//breadcrumb dropdown element is clicked
	$("#breadcrumb-dropdown").on("click", ".dropdown-element", function() {
		setFolder(this.getAttribute("data-id"));
	});
	$("#breadcrumb .custom-breadcrumb").on("click", function() {
		var id = this.getAttribute('data-id');
		setFolder(id);
	});
	var rootCrumb = document.getElementById('root-nav');
	rootCrumb.oncontextmenu = function(e) {
		createDropdownMenu(rootCrumb);
		MoveDropdownItemsToElement(this);
		e.preventDefault();
	}
	RenderBreadCrumbPath(ROOT);
});
//peter
$(document).ready(function() {
	$("#search-box").on('keyup', function(e) {
		if ($(this).val().length == 0) {
			$("#clear-btn").attr("disabled", true);
			return;
		}
		$("#clear-btn").attr("disabled", false);
		if (e.keyCode == 13) {
			CreateSearchCrumb($(this).val());
			searchFileSystem($(this).val());
		}
	});
	$("#clear-btn").click(function() {
		$("#search-box").val("").focus();
		$("#clear-btn").attr("disabled", true);
	});
});
function searchFileSystem(m) {
	var found = [];
	$.each(filesystem, function(key, value) {
		if (value.name.indexOf(m) > -1) {
			found.push(value);
		}
	});
	displayList(null, found);
}
function countJSONKeys(obj) {
	var count=0;
	for(var prop in obj) {
	   if (obj.hasOwnProperty(prop)) {
		  ++count;
	   }
	}
	return count;
 }
//emil
function displayList(parent, childrenObjects) {
	var holder = $("#tableView")[0];
	$(holder).empty();
	var iconName;
	if (countJSONKeys(childrenObjects) == 0) {
		var nofilesmessage = el("section", {class:"panel panel-default"});
		var panelbody = el("section", {class:"panel-body"});
		var inner = document.createTextNode("No files in this folder");
		panelbody.appendChild(inner);
		nofilesmessage.appendChild(panelbody);
		$("#tableView").append(nofilesmessage);
		return;
	}
    $.each(childrenObjects, function (id, value) {
        var row = undefined;
        if (value.file_ext == ".stl") {
            row = el("section", {
                "data-id": value.id,
                class: "row listViewItem",
				//Downloadable STL URL goes here
                "onclick": "webView.performClick(\"http://10.0.2.2:8888/download/"+value.id+"\");"
            });
        }
        else {
            row = el("section", {
                "data-id": value.id,
                class: "row listViewItem"
            });
        }
		if (value.type == "folder") {
			iconName = "fa fa-folder-open fa-3x";
		}
		if (value.type == "file") {
			iconName = "fa fa-file-o fa-3x";
		}
		var checkbox = el("section", {class:"col-lg-1 col-md-1"});
		var input = el("input", {type:"checkbox", class:"form-control", "data-id":value.id});
		input.onclick = function(e) {
			e.stopPropagation();
		}
		checkbox.appendChild(input);
		var icon = el("section", {class: "col-lg-1 col-md-1"});
		var fa = el("i", {class: iconName});
		icon.appendChild(fa);
		var name = el("section", {class: "col-lg-5 col-md-5"});
		var h4 = el("h4", {html: value.name});
		name.appendChild(h4);
		var date = el("section", {class: "col-lg-5 col-md-5"});
        if (value.type == "file") {
            var h4 = el("h4", {html: moment(value.updated * 1000).format("YYYY-MM-DD")});
            date.appendChild(h4);
		}
		row.appendChild(checkbox);
		row.appendChild(icon);
		row.appendChild(name);
		row.appendChild(date);
		holder.appendChild(row);
	});
}
function getSelectedFiles() {
	files = [];
	$("#tableViewport input[type='checkbox']").each(function(e) {
		if ($(this).is(":checked")) {
			files.push($(this).attr("data-id"));
		}
	});
	return files;
}
(function($, window) {
	$.fn.contextMenu = function(settings) {
		return this.each(function() {
			// Code Goes Here
			$(this).on("contextmenu", function(e) {
				var $menu = $(settings.menuSelector).data("invokedOn", $(e.target)).show().css({
					position: "absolute",
					left: getMenuPosition(e.clientX, 'width', 'scrollLeft'),
					top: getMenuPosition(e.clientY, 'height', 'scrollTop')
				}).off('click').on('click', 'a', function(e) {
					$menu.hide();
					var $invokedOn = $menu.data("invokedOn");
					var $selectedMenu = $(e.target);
					settings.menuSelected.call(this, $invokedOn, $selectedMenu);
				});
				return false;
			});
			//make sure menu closes on any click
			$('body').click(function() {
				$(settings.menuSelector).hide();
			});
		});
		function getMenuPosition(mouse, direction, scrollDir) {
			var win = $(window)[direction](),
				scroll = $(window)[scrollDir](),
				menu = $(settings.menuSelector)[direction](),
				position = mouse + scroll;
			// opening menu would pass the side of the page
			if (mouse + menu > win && menu < mouse) position -= menu;
			return position;
		}
	};
})(jQuery, window);
function scan_for_advanced_search_type_conflicts() {
	selected_types = [];
	$("#criteria .select-type").each(function() {
		if (selected_types.indexOf($(this).val()) > -1) {
			$("#type-warning").removeClass("hidden");
			return false;
		}
		else {
			$("#type-warning").addClass("hidden");
			selected_types.push($(this).val());
		}
	});
}
function count(obj) {
	//https://stackoverflow.com/questions/6283466/count-key-values-in-json#6283527
	var count=0;
	for(var prop in obj) {
	   if (obj.hasOwnProperty(prop)) {
		  ++count;
	   }
	}
	return count;
 }
$(document).ready(function() {
	$("#info_save").on("click", function() {
		var data = $("#attachedInfoModalBody .alpaca-form").serializeArray();
		var object={};
		$.each(data,function(key,value) {
		  object[value.name] = value.value;
		});
		$.ajax({
			url:"fileinformation",
			data:{"fileId":$("#contextMenu").attr("data-id"),"fileInfo":JSON.stringify(object)},
			method:"post",
			dataType:"JSON",
			success:function(data) {
				if (!data.success) {
					alert("Could not save data");
					return;
				}
				$("#attachedInfoModal").modal("hide");
			},
			error:function() {
				alert("It is not possible to attach information here");
			}
		});
	});
	//Handles menu drop down
	$('.dropdown-menu').find('form').click(function(e) {
		e.stopPropagation();
	});
	$("#delete-btn").on("click", function() {
		files = getSelectedFiles();
		$.ajax({
			url:"/filesystem",
			method:"DELETE",
			data:{"files":JSON.stringify(files)},
			dataType:"JSON",
			success:function(data) {
				if (!data.success) {
					alert("Could not delete that folder");
					return;
				}
				if (count(data.failed_files) >= 1) {
					alert("Could not delete one or more files");
				}
				refreshFilesystem();
			}
		});	
	});
	$("#tableView").on("click", ".listViewItem", function() {
		if ($(this).hasClass("selected")) {
			var fileId = this.getAttribute("data-id");
			if (setFolder(fileId) == false) {
				//var a = el("a", {href:("/download/" + fileId), target:"_blank"});
				//$("#tableView").append(a);
				//a.click();
				//$("#tableView").remove(a);
			}
			return;
		}
		$("#tableView .listViewItem").removeClass("selected");
		$(this).addClass("selected");
		var fileId = this.getAttribute("data-id");
		$.ajax({
			method:"GET",
			url:"/fileinformation",
			data:{"fileId":fileId},
			dataType:"JSON",
			success:function(data) {
				if (!data.success) {
					alert("nerror getting file informatio");
					return;
				}
				$("#info-list").empty();
				$.each(data.data, function(key, value) {
					var li = el("li", {class:"file-info-value"});
					var key = el("b", {html:key, style:"padding-right:5px"});
					var value = document.createTextNode(value);
					li.appendChild(key);
					li.appendChild(value);
					$("#info-list").append(li);
				});
			}
		});
    });
    $("#tableView").on("contextmenu", ".row", function(e) {
        $("#contextMenu").css("top", e.clientY).css("left", e.clientX).css("display", "block").removeClass("hidden").attr("data-id", $(e.target).closest(".row").attr("data-id"));
        e.preventDefault();
        e.stopPropagation();
    });
    $(document).on("click", function() {
        $("#contextMenu").addClass("hidden");
    });
    $("#traceDropdown").on("click", function() {
        $("#traceModal").attr("data-id", $("#contextMenu").attr("data-id"));
	});
	$("#attachedInfoDropdown").on("click", function() {
		$("#attachedInfoModalBody").empty();			
		$.ajax({
			url:"filetemplate",
			data:{"fileId":$("#contextMenu").attr("data-id")},
			method:"post",
			dataType:"JSON",
			success:function(data) {
				console.log(data.form);
				$("#attachedInfoModalBody").alpaca(data.form);
			},
			error:function() {
				alert("It is not possible to attach information here");
			}
		});
	});
	$("#dropDownload").on("click", function() {
		var dataId = $("#contextMenu").attr("data-id");
		if (setFolder(dataId) == false) {
		 	// is file
			console.log("downlaoding");
		 	var a = el("a", {href:("/download/" + dataId), target:"_blank"});
		 	$("#tableView").append(a);
		 	a.click();
		 	$("#tableView").remove(a);
		}
	});
	$("#addNewType").on("click", function() {
		var numOfCriteria = $("#criteria .search-query").length;
		CRITERIA = count(window.types);
		if (numOfCriteria == CRITERIA-1) {
			$("#addNewType").html("<span class='translate'>No more unique types!</span>").attr("disabled", true).removeClass("btn-success").addClass("btn-info");
		}
		var row = el("section", {class:"row search-query",style:"margin-top:5px;"});
		var col = el("section",{class:"col-md-4"});
		var select = el("select", {class:"form-control select-type"});
		$.each(window.types, function(key, value) {
			var option = el("option", {html:value, value:key});
			select.appendChild(option);
		});
		col.appendChild(select);
		row.appendChild(col);
		var col = el("section",{class:"col-md-8"});
		var input = el("input", {class:"form-control search-expression", "placeholder":"value", })
		col.appendChild(input);
		row.appendChild(col);
		$("#criteria").append(row);
		$(input).focus();
		scan_for_advanced_search_type_conflicts();
	});
	$("#criteria").on("change", ".select-type", function() {
		scan_for_advanced_search_type_conflicts()
	});
	$("#search-btn").on("click", function() {
		$("#criteria").empty();			
		$.ajax({
			url:"/types",
			method:"GET",
			dataType:"JSON",
			success:function(data) {
				if (!data.success) {
					alert("Could not get types");
					return;
				}
				window.types = data.types;
				$("#addNewType").html("<span class='translate'>Add New Type</span>").attr("disabled", false).addClass("btn-success").removeClass("btn-info");				
				$("#addNewType").click();
			},
			error:function() {
				alert("Could not get types");
			}
		});
	});
	// send email
	$("#changeAlert").on("click", function() {
		data_id = $("#contextMenu").attr("data-id");
		$.post("subscribe", {fileKey: data_id});		
	});	
});
//reem
function getProjectId(id) {
	var found;
	$.each(filesystem, function(key, value) {
		if (value.id)
			if (value.id == id) found = value.project_id;
	});
	return found;
}

function getcustomer(project_id) {
	var found;
	$.each(filesystem, function(key, value) {
		if (value.project_id && value.extention)
			if (value.project_id == project_id && value.extention == "customer") found = value;
	});
	return found;
}

function getCADlist(project_id) {
	var found = [];
	$.each(filesystem, function(key, value) {
		if (value.project_id && value.extention)
			if (value.project_id == project_id && value.extention == "CAD") found.push(value);
	});
	return found;
}

function getPRTlist(project_id) {
	var found = [];
	$.each(filesystem, function(key, value) {
		if (value.project_id && value.extention)
			if (value.project_id == project_id && value.extention == "STL") found.push(value);
	});
	return found;
}

function getBuildlist(project_id) {
	var found = [];
	$.each(filesystem, function(key, value) {
		if (value.project_id && value.extention)
			if (value.project_id == project_id && value.extention == "build") found.push(value);
	});
	return found;
}

function getImage(project_id, build_id) {
	var found = [];
	$.each(filesystem, function(key, value) {
		if (value.project_id && value.extention && value.build_id)
			if (value.project_id == project_id && value.extention == "image" && value.build_id == build_id) found.push(value);
	});
	return found;
}

function getMaterial(project_id, build_id) {
	var found = [];
	$.each(filesystem, function(key, value) {
		if (value.project_id && value.extention && value.build_id)
			if (value.project_id == project_id && value.extention == "material" && value.build_id == build_id) found.push(value);
	});
	return found;
}

function getMaterialMeasures(project_id, build_id, material_id) {
	var found = [];
	$.each(filesystem, function(key, value) {
		if (value.project_id && value.extention && value.build_id && material_id)
			if (value.project_id == project_id && value.extention == "measure" && value.build_id == build_id && value.material_id == material_id) found.push(value);
	});
	return found;
}

function getSLM(project_id, build_id) {
	var found = [];
	$.each(filesystem, function(key, value) {
		if (value.project_id && value.extention && value.build_id)
			if (value.project_id == project_id && value.extention == "SLM" && value.build_id == build_id) found.push(value);
	});
	return found;
}

function createHREF(value) {
	var a = document.createElement('a');
	if ((!value) || (!value.name) || (!value.id)) { 
		return el("a", {html:"UNDEFINED"});
	}
	var linkText = document.createTextNode(value.name);
	a.appendChild(linkText);
	a.setAttribute('href', "#");
	a.setAttribute('class', 'list-group-item');
	a.setAttribute('data-id', value.id);
	return a;
}

function createHREFSUB(value) {
	var a = document.createElement('a');
	var linkText = document.createTextNode(value.name);
	a.appendChild(linkText);
	a.setAttribute('href', "#");
	a.setAttribute('class', 'list-group-item');
	a.setAttribute('data-parent', '#SubMenu1');
	return a;
}

function appendItem(fileview, value, group) {
	var ahref;
	if (group == "1") var ahref = createHREF(value);
	else if (group == "0") var ahref = createHREFSUB(value);
	fileview.appendChild(ahref);
}

function createHREFMAIN(text, id_name, dataparent) {
	var a = document.createElement('a');
	var linkText = document.createTextNode(text);
	var i = document.createElement('i');
	i.setAttribute('class', 'fa fa-caret-down');
	a.appendChild(linkText);
	a.appendChild(i);
	a.setAttribute('href', id_name);
	a.setAttribute('class', 'list-group-item');
	a.setAttribute('data-toggle', 'collapse');
	a.setAttribute('data-parent', dataparent);
	return a;
}

function createDIV(id_name) {
	var div = document.createElement('div');
	div.setAttribute('class', 'collapse list-group-submenu');
	div.setAttribute('id', id_name);
	return div;
}

function createsublist(fileview, href_id, project_id, value) {
	var id_name = "SubMenu" + href_id;
	var href = createHREFMAIN(value.name, '#' + id_name, '#SubMenu');
	fileview.appendChild(href);
	var div = createDIV(id_name);
	fileview.appendChild(div);
	// view SLM files
	var id_name = "SubMenu5" + href_id;
	var href6 = createHREFMAIN("SLMs", '#' + id_name, '#SubMenu1');
	div.appendChild(href6);
	var div6 = createDIV(id_name);
	div.appendChild(div6);
	var files = getSLM(project_id, value.id);
	for (i = 0; i < files.length; i++) {
		var ahrefl = createHREF(files[i]);
		div6.appendChild(ahrefl);
	}
	// view Images
	var id_name = "SubMenu4" + href_id;
	var href5 = createHREFMAIN("Images", '#' + id_name, '#SubMenu1');
	div.appendChild(href5);
	var div5 = createDIV(id_name);
	div.appendChild(div5);
	var images = getImage(project_id, value.id);
	for (f = 0; f < images.length; f++) {
		var ahrefl = createHREF(images[f]);
		div5.appendChild(ahrefl);
	}
	// view Material 
	var id_name = "SubMenu6" + href_id;
	var href4 = createHREFMAIN("Material", '#' + id_name, '#SubMenu1');
	div.appendChild(href4);
	var div4 = createDIV(id_name);
	div.appendChild(div4);
	var material = getMaterial(project_id, value.id);
	for (i = 0; i < material.length; i++) {
		var ahrefl = createHREF(material[i]);
		div4.appendChild(ahrefl);
	}
	// view Measures 
	var id_name = "SubMenu2" + href_id;
	var href3 = createHREFMAIN("Measures", '#' + id_name, '#SubMenu1');
	div.appendChild(href3);
	var div3 = createDIV(id_name);
	div.appendChild(div3);
	for (x = 0; x < material.length; x++) {
		var files = getMaterialMeasures(project_id, value.id, material[x].id);
		console.log(material[x]);
		for (i = 0; i < files.length; i++) {
			var ahrefl = createHREF(files[i]);
			div3.appendChild(ahrefl);
		}
	}
}

function createBuildNode(fileview, project_id) {
	var build_id = getBuildlist(project_id);
	for (t = 0; t < build_id.length; t++) {
		createsublist(fileview, t, project_id, build_id[t]);
	}
}
////////////////////////////////////////////////////////////
// return array of files names according to status ( returen open files,  returen closed files)
function getstatusFiles(status) {
	var found = [];
	$.each(filesystem, function(key, value) {
		if (value.status == status) found.push(value);
	});
	return found;
}
// return array of files names according to status ( returen open files,  returen closed files, or owner)
function getMyFiles(user_id) {
	var found = [];
	$.each(filesystem, function(key, value) {
		if (value.owner)
			for (j = 0; j < value.owner.length; j++)
				if (value.owner[j] == user_id) {
					found.push(value);
					break;
				}
    });
    return found;
}
// reurn shared with me files
function getUserFile(user_id) {
	var found = [];
	$.each(filesystem, function(key, value) {
		if (value.user)
			for (j = 0; j < value.user.length; j++)
				if (value.user[j] == user_id) {
					found.push(value);
					break;
				}
	});
	return found;
}
function renderTraceTree(id) {
	var project_id = getProjectId(id);
	var fileview = document.getElementById("fileview6");
	$(fileview).empty();
	var files = getCADlist(project_id);
	for (i = 0; i < files.length; i++) {
		appendItem(fileview, files[i], "1");
	}
	var fileview = document.getElementById("fileview11");
	$(fileview).empty();
	var customer = getcustomer(project_id);
	appendItem(fileview, customer, "1");
	var fileview = document.getElementById("fileview12");
	$(fileview).empty();
	var files = getPRTlist(project_id);
	for (i = 0; i < files.length; i++) {
		appendItem(fileview, files[i], "1");
	}
	var fileview = document.getElementById("demo7");
	$(fileview).empty();
	createBuildNode(fileview, project_id);
	$("#TraceMenu").on("click", ".list-group-item", function() {
		setFolder($(this).attr("data-id"));
	})
}