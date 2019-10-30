(function () {
	/* global $,OpenSeadragon,ko */

	var appTitle = 'OpenSeadragon Imaging';
	var appDesc = 'OpenSeadragonImagingHelper / OpenSeadragonViewerInputHook Plugins';

	$(window).resize(onWindowResize);
	$(window).resize();

	var tileSourcesPrefix = './data/';
	var tileSources = [
		tileSourcesPrefix + 'testpattern.dzi',
		tileSourcesPrefix + 'tall.dzi',
		tileSourcesPrefix + 'wide.dzi',
		new OpenSeadragon.LegacyTileSource( [{
			url: tileSourcesPrefix + 'dog_radiograph_2.jpg',
			width: 1909,
			height: 1331
		}] )
	];

	var _navExpanderIsCollapsed = true,
		_$navExpander = $('.navigatorExpander'),
		_$navExpanderHeaderContainer = $('.expanderHeaderContainer'),
		_$navExpanderHeader = $(_$navExpanderHeaderContainer.children()[0]),
		_$navExpanderContentContainer = $('.expanderContentContainer'),
		_navExpanderExpandedOpacity = 1.0,
		_navExpanderCollapsedOpacity = 0.40,
		_navExpanderWidth = 190,
		_navExpanderHeight = 220,
		_navExpanderCollapsedWidth = _$navExpanderHeader.outerWidth(),
		_navExpanderCollapsedHeight = _$navExpanderHeaderContainer.outerHeight();

	var viewer = OpenSeadragon({
		// debugMode: true,
		id: 'viewerDiv1',
		prefixUrl: 'content/images/openseadragon/',
		useCanvas: true,
		autoResize: false, // If false, we have to handle resizing of the viewer
		// blendTime: 0,
		// wrapHorizontal: true,
		// visibilityRatio: 0.1,
		// minZoomLevel: 0.001,
		// maxZoomLevel: 10,
		// zoomPerClick: 1.4,
		minZoomImageRatio: 0,
		maxZoomPixelRatio: Infinity,
		smoothTileEdgesMinZoom: Infinity,
		//------------------
		// gestureSettingsMouse: {
		// 	flickEnabled: true
		// },
		// gestureSettingsTouch: {
		// 	pinchRotate: true
		// },
		//------------------
		showNavigationControl: true,
		navigationControlAnchor: OpenSeadragon.ControlAnchor.BOTTOM_LEFT,
		// showRotationControl: true,
		// showFlipControl: true,
		//------------------
		showNavigator: true,
		// navigatorSizeRatio: 0.25,
		navigatorId: 'navigatorDiv1',
		navigatorAutoResize: false,
		//------------------
		sequenceMode: true,
		// initialPage: 3,
		// preserveViewport: true,
		// preserveOverlays: false,
		showSequenceControl: true,
		sequenceControlAnchor: OpenSeadragon.ControlAnchor.BOTTOM_LEFT,
		// showReferenceStrip: true,
		// referenceStripScroll: 'horizontal',
		// referenceStripElement: null,
		// referenceStripHeight: null,
		// referenceStripWidth: null,
		// referenceStripPosition: 'BOTTOM_LEFT',
		// referenceStripSizeRatio: 0.2,
		//------------------
		collectionMode: false,
		// collectionLayout: 'horizontal',
		collectionRows: 2,
		collectionColumns: 2,
		// collectionTileSize: 800,
		// collectionTileMargin: 80,
		//------------------
		tileSources: tileSources
	});
	// // eslint-disable-line no-unused-vars
	// var annoHost = viewer.activateAnnoHost({
	// 	worldIndex: 0,
	// 	onImageViewChanged: onImageViewChanged
	// });
	// // eslint-disable-line no-unused-vars
	// eslint-disable-line no-unused-vars
	var annoHost = viewer.activateImagingHelper({
		worldIndex: 0,
		onImageViewChanged: onImageViewChanged
	});
	// eslint-disable-line no-unused-vars
	viewer.addViewerInputHook({hooks: [
		{tracker: 'viewer', handler: 'moveHandler', hookHandler: onHookOsdViewerMove},
		{tracker: 'viewer', handler: 'scrollHandler', hookHandler: onHookOsdViewerScroll},
		{tracker: 'viewer', handler: 'clickHandler', hookHandler: onHookOsdViewerClick}
	]});
	var _$osdCanvas = null;
	//var _$annoHostSvg = $('.osdi-annohost-svg');

	// Workaround for Edge browser where SVG foreignObject elements don't rescale properly via scale transform
	//  (Issue: https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/4320441/)
	void(new MutationObserver(function (muts) {
		for (var i = muts.length; i--;) {
			var mut = muts[i], objs = mut.target.querySelectorAll('foreignObject');
			for (var j = objs.length; j--;) {
				var obj = objs[j];
				// var val = obj.style.display;
				// obj.style.display = 'none';
				// obj.getBBox();
				// obj.style.display = val;
				if (obj.style) {
					var val = obj.style.visibility;
					obj.style.visibility = 'hidden';
					obj.getBBox();
					obj.style.visibility = val;
				}
			}
		}
	}).observe(document.documentElement, {attributes: true, attributeFilter: ['transform'], subtree: true}));

	//TODO Need workaround for Edge browser where vector-effect="non-scaling-stroke" is not honored
	//  (Issue: https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/7326047/

	// // Example SVG annotation overlay.  We use these observables to keep the example annotation sync'd with the image zoom/pan
	// var annoGroupTranslateX = ko.observable(0.0),
	// 	annoGroupTranslateY = ko.observable(0.0),
	// 	annoGroupScale = ko.observable(1.0),
	// 	annoGroupTransform = ko.computed(function () {
	// 		return 'translate(' + annoGroupTranslateX() + ',' + annoGroupTranslateY() + ') scale(' + annoGroupScale() + ')';
	// 		//return 'translate(' + annoGroupTranslateX() + ',' + annoGroupTranslateY() + ')';
	// 	}, this);

	viewer.addHandler('open', function (event) {
		_$osdCanvas = $(viewer.canvas);
		setMinMaxZoomForImage();
		outputVM.haveImage(true);
		_$osdCanvas.on('mouseenter.osdimaginghelper', onOsdCanvasMouseEnter);
		_$osdCanvas.on('mousemove.osdimaginghelper', onOsdCanvasMouseMove);
		_$osdCanvas.on('mouseleave.osdimaginghelper', onOsdCanvasMouseLeave);
		updateImageVM();
		updateImgViewerViewVM();
		updateImgViewerDataCoordinatesVM();

		_$navExpander.css( 'visibility', 'visible');
		if (_navExpanderIsCollapsed) {
			_navExpanderDoCollapse(false);
		}
		else {
			_navExpanderDoExpand(true);
		}

		//_$annoHostSvg.css( 'visibility', 'visible');

		//// Example OpenSeadragon overlay
		//var olDiv = document.createElement('div');
		//olDiv.style.background = 'rgba(255,0,0,0.25)';
		//var olRect = new OpenSeadragon.Rect(-0.1, -0.1, 1.2, 1.0 / event.viewer.source.aspectRatio + 0.2);
		////var olRect = new OpenSeadragon.Rect(-0.5, -0.5, 2.0, 1.0 / event.viewer.source.aspectRatio + 1.0);
		//_this._osd.drawer.addOverlay({
		//    element: olDiv,
		//    location: olRect,
		//    placement: OpenSeadragon.OverlayPlacement.TOP_LEFT
		//    //onDraw: function (position, size, element) {
		//    //    position = position || null;
		//    //}
		//});

		// Example OpenSeadragon overlay
		// var img = document.createElement('img');
		// img.src = 'content/images/openseadragon/next_rest.png';
		var canvasElement;
		var m_context;
		canvasElement = document.createElement('canvas');
		canvasElement.width = 200;
		canvasElement.height = 200;
		m_context = canvasElement.getContext('2d');
		m_context.fillStyle = '#FF0000';
		m_context.fillRect(4, 4, 192, 192);
		//--------------------------------------------------
		// //TODO this should be possible...fix in OSD!
		// var overlay = new OpenSeadragon.Overlay({
		// 	element: canvasElement,
		// 	location: new OpenSeadragon.Point(0.02, 0.02),
		// 	placement: OpenSeadragon.Placement.TOP_LEFT,
		// 	//onDraw: , // OnDrawCallback(position, size, element)
		// 	checkResize: false,
		// 	//width: ,
		// 	//height: ,
		// 	rotationMode: OpenSeadragon.OverlayRotationMode.EXACT // NO_ROTATION, EXACT, BOUNDING_BOX
		// });
		// viewer.addOverlay(overlay);
		//--------------------------------------------------
		viewer.addOverlay(canvasElement,
				new OpenSeadragon.Point(0.02, 0.02),
				OpenSeadragon.Placement.TOP_LEFT);
		var originalPos;
		new OpenSeadragon.MouseTracker({
			element: canvasElement,
			pressHandler: function (event) {
				originalPos = ;
			},
			dragHandler: function (event) {
				// let windowCoords = new OpenSeadragon.Point(event.originalEvent.x, event.originalEvent.y);
				// let viewportCoords = viewer.viewport.windowToViewportCoordinates(windowCoords);
				// let overlay = viewer.getOverlayById(this.element);

				// //todo: somehow calculate these values to update the overlay size as the user drags
				// deltax=0;
				// deltay=0;
				// let r = new OpenSeadragon.Rect(viewportCoords.x, viewportCoords.y, overlay.width+deltax, overlay.height+deltax);
				// overlay.update(r, OpenSeadragon.Placement.CENTER);
				// overlay.drawHTML(this.element.parentNode, viewer.viewport);

				// console.log("drag delta: " + event.delta + " viewportCoords: " + viewportCoords + "windowCoords: " + windowCoords);
			}
		}).setTracking(true);

		// Example OpenSeadragon overlays
		// var locPoint = new OpenSeadragon.Point(0.02, 0.02);
		// var locPointPlus = new OpenSeadragon.Point(0.02, 0.02);
		// var overlay;
		// var m_canvas;
		// var m_context;
		// for (var x = 0; x < 50; x++) {
		// 	m_canvas = document.createElement('canvas');
		// 	m_canvas.width = 200;
		// 	m_canvas.height = 200;
		// 	m_context = m_canvas.getContext('2d');
		// 	m_context.fillStyle = '#FF0000';
		// 	m_context.fillRect(4, 4, 192, 192);
		// 	// m_context.moveTo(p1.x, p1.y);
		// 	// m_context.lineTo(p2.x, p2.y);
		// 	// m_context.stroke();
		// 	overlay = new OpenSeadragon.Overlay({
		// 		element: m_canvas,
		// 		location: locPoint,
		// 		placement: OpenSeadragon.Placement.TOP_LEFT,
		// 		//onDraw: , // OnDrawCallback(position, size, element)
		// 		checkResize: false,
		// 		//width: ,
		// 		//height: ,
		// 		rotationMode: OpenSeadragon.OverlayRotationMode.EXACT // NO_ROTATION, EXACT, BOUNDING_BOX
		// 	});
		// 	viewer.addOverlay(overlay);
		// 	locPoint = locPoint.plus(locPointPlus);
		// }
	});

	viewer.addHandler('close', function (event) {
		_$navExpander.css( 'visibility', 'hidden');
		//_$annoHostSvg.css( 'visibility', 'hidden');
		outputVM.haveImage(false);
		_$osdCanvas.off('mouseenter.osdimaginghelper', onOsdCanvasMouseEnter);
		_$osdCanvas.off('mousemove.osdimaginghelper', onOsdCanvasMouseMove);
		_$osdCanvas.off('mouseleave.osdimaginghelper', onOsdCanvasMouseLeave);
		_$osdCanvas = null;
	});

	viewer.addHandler('navigator-scroll', function (event) {
		if (event.scroll > 0) {
			annoHost.zoomIn();
		}
		else {
			annoHost.zoomOut();
		}
	});

	viewer.addHandler('pre-full-page', function (event) {
		if (event.fullPage) {
			// Going to full-page mode...remove our bound DOM elements
			vm.outputVM(null);
			//vm.svgOverlayVM(null);
		}
	});

	viewer.addHandler('full-page', function (event) {
		if (!event.fullPage) {
			// Exited full-page mode...restore our bound DOM elements
			vm.outputVM(outputVM);
			//vm.svgOverlayVM(svgOverlayVM);
			//_$annoHostSvg.css( 'visibility', 'visible');
		}
	});

	viewer.addHandler('pre-full-screen', function (event) {
		if (event.fullScreen) {
			// Going to full-screen mode...remove our bound DOM elements
			vm.outputVM(null);
			//vm.svgOverlayVM(null);
		}
	});

	viewer.addHandler('full-screen', function (event) {
		if (!event.fullScreen) {
			// Exited full-screen mode...restore our bound DOM elements
			vm.outputVM(outputVM);
			//vm.svgOverlayVM(svgOverlayVM);
			//_$annoHostSvg.css( 'visibility', 'visible');
		}
	});

	function setMinMaxZoomForImage() {
		var minzoomX = 50.0 / annoHost.imgWidth;
		var minzoomY = 50.0 / annoHost.imgHeight;
		var minZoom = Math.min(minzoomX, minzoomY);
		var maxZoom = 10.0;
		annoHost.setMinZoom(minZoom);
		annoHost.setMaxZoom(maxZoom);
		annoHost.setZoomStepPercent(35);
	}

	function onImageViewChanged(event) {
		// event.viewportWidth == width of viewer viewport in logical coordinates relative to image native size
		// event.viewportHeight == height of viewer viewport in logical coordinates relative to image native size
		// event.viewportOrigin == OpenSeadragon.Point, top-left of the viewer viewport in logical coordinates relative to image
		// event.viewportCenter == OpenSeadragon.Point, center of the viewer viewport in logical coordinates relative to image
		// event.zoomFactor == current zoom factor
		updateImgViewerViewVM();
		updateImgViewerScreenCoordinatesVM();
		updateImgViewerDataCoordinatesVM();

		// // Example SVG annotation overlay - keep the example annotation sync'd with the image zoom/pan
		// //var p = viewer.viewport.pixelFromPoint(new OpenSeadragon.Point(0, 0), true);
		// var p = annoHost.logicalToPhysicalPoint(new OpenSeadragon.Point(0, 0));
		// annoGroupTranslateX(p.x);
		// annoGroupTranslateY(p.y);
		// annoGroupScale(annoHost.getZoomFactor());
	}

	function onHookOsdViewerMove(event) {
		// set event.stopHandlers = true to prevent any more handlers in the chain from being called
		// set event.stopBubbling = true to prevent the original event from bubbling
		// set event.preventDefaultAction = true to prevent viewer's default action
		outputVM.osdMouseRelativeX(event.position.x);
		outputVM.osdMouseRelativeY(event.position.y);
		event.stopHandlers = true;
		event.stopBubbling = true;
		event.preventDefaultAction = true;
	}

	function onHookOsdViewerScroll(event) {
		// set event.stopHandlers = true to prevent any more handlers in the chain from being called
		// set event.stopBubbling = true to prevent the original event from bubbling
		// set event.preventDefaultAction = true to prevent viewer's default action
		var logPoint = annoHost.physicalToLogicalPoint(event.position);
		if (event.scroll > 0) {
			annoHost.zoomInAboutLogicalPoint(logPoint);
		}
		else {
			annoHost.zoomOutAboutLogicalPoint(logPoint);
		}
		event.stopBubbling = true;
		event.preventDefaultAction = true;
	}

	function onHookOsdViewerClick(event) {
		// set event.stopHandlers = true to prevent any more handlers in the chain from being called
		// set event.stopBubbling = true to prevent the original event from bubbling
		// set event.preventDefaultAction = true to prevent viewer's default action
		if (event.quick) {
			var logPoint = annoHost.physicalToLogicalPoint(event.position);
			if (event.shift) {
				annoHost.zoomOutAboutLogicalPoint(logPoint);
			}
			else {
				annoHost.zoomInAboutLogicalPoint(logPoint);
			}
		}
		event.stopBubbling = true;
		event.preventDefaultAction = true;
	}

	function onOsdCanvasMouseEnter(event) {
		outputVM.haveMouse(true);
		updateImgViewerScreenCoordinatesVM();
	}

	function onOsdCanvasMouseMove(event) {
		var osdmouse = OpenSeadragon.getMousePosition(event),
			osdoffset = OpenSeadragon.getElementOffset(viewer.canvas);
		outputVM.osdMousePositionX(osdmouse.x);
		outputVM.osdMousePositionY(osdmouse.y);
		outputVM.osdElementOffsetX(osdoffset.x);
		outputVM.osdElementOffsetY(osdoffset.y);

		var offset = _$osdCanvas.offset();
		outputVM.mousePositionX(event.pageX);
		outputVM.mousePositionY(event.pageY);
		outputVM.elementOffsetX(offset.left);
		outputVM.elementOffsetY(offset.top);
		outputVM.mouseRelativeX(event.pageX - offset.left);
		outputVM.mouseRelativeY(event.pageY - offset.top);
		updateImgViewerScreenCoordinatesVM();
	}

	function onOsdCanvasMouseLeave(event) {
		outputVM.haveMouse(false);
	}

	function updateImageVM() {
		if (outputVM.haveImage()) {
			outputVM.imgWidth(annoHost.imgWidth);
			outputVM.imgHeight(annoHost.imgHeight);
			outputVM.imgAspectRatio(annoHost.imgAspectRatio);
			outputVM.minZoom(annoHost.getMinZoom());
			outputVM.maxZoom(annoHost.getMaxZoom());
		}
	}

	function updateImgViewerViewVM() {
		if (outputVM.haveImage()) {
			var containerSize = viewer.viewport.getContainerSize();
			outputVM.osdContainerWidth(containerSize.x);
			outputVM.osdContainerHeight(containerSize.y);
			outputVM.osdZoom(viewer.viewport.getZoom(true));

			var boundsRect = viewer.viewport.getBounds(true);
			outputVM.osdBoundsX(boundsRect.x);
			outputVM.osdBoundsY(boundsRect.y);
			outputVM.osdBoundsWidth(boundsRect.width);
			outputVM.osdBoundsHeight(boundsRect.height);

			var tiledImage = viewer.world.getItemAt(0);
			var boundsTiledImageRect = tiledImage.getBounds(true);
			outputVM.osdTiledImageBoundsX(boundsTiledImageRect.x);
			outputVM.osdTiledImageBoundsY(boundsTiledImageRect.y);
			outputVM.osdTiledImageBoundsWidth(boundsTiledImageRect.width);
			outputVM.osdTiledImageBoundsHeight(boundsTiledImageRect.height);

			outputVM.zoomFactor(annoHost.getZoomFactor());
			outputVM.viewportWidth(annoHost._viewportWidth);
			outputVM.viewportHeight(annoHost._viewportHeight);
			outputVM.viewportOriginX(annoHost._viewportOrigin.x);
			outputVM.viewportOriginY(annoHost._viewportOrigin.y);
			outputVM.viewportCenterX(annoHost._viewportCenter.x);
			outputVM.viewportCenterY(annoHost._viewportCenter.y);
		}
	}

	function updateImgViewerScreenCoordinatesVM() {
		if (outputVM.haveImage() && outputVM.haveMouse()) {
			var logX = annoHost.physicalToLogicalX(outputVM.mouseRelativeX());
			var logY = annoHost.physicalToLogicalY(outputVM.mouseRelativeY());
			outputVM.physicalToLogicalX(logX);
			outputVM.physicalToLogicalY(logY);
			outputVM.logicalToPhysicalX(annoHost.logicalToPhysicalX(logX));
			outputVM.logicalToPhysicalY(annoHost.logicalToPhysicalY(logY));
			var dataX = annoHost.physicalToDataX( outputVM.mouseRelativeX());
			var dataY = annoHost.physicalToDataY( outputVM.mouseRelativeY());
			outputVM.physicalToDataX(dataX);
			outputVM.physicalToDataY(dataY);
			outputVM.dataToPhysicalX(annoHost.dataToPhysicalX(dataX));
			outputVM.dataToPhysicalY(annoHost.dataToPhysicalY(dataY));
		}
	}

	function updateImgViewerDataCoordinatesVM() {
		if (outputVM.haveImage()) {
			outputVM.logicalToDataTLX(annoHost.logicalToDataX(0.0));
			outputVM.logicalToDataTLY(annoHost.logicalToDataY(0.0));
			outputVM.logicalToDataBRX(annoHost.logicalToDataX(1.0));
			outputVM.logicalToDataBRY(annoHost.logicalToDataY(1.0));
			outputVM.dataToLogicalTLX(annoHost.dataToLogicalX(0));
			outputVM.dataToLogicalTLY(annoHost.dataToLogicalY(0));
			outputVM.dataToLogicalBRX(annoHost.dataToLogicalX(annoHost.imgWidth));
			outputVM.dataToLogicalBRY(annoHost.dataToLogicalY(annoHost.imgHeight));
		}
	}

	function onWindowResize() {
		var headerheight = $('.shell-header-wrapper').outerHeight(true);
		var footerheight = $('.shell-footer-wrapper').outerHeight(true);
		//var shellheight = $('.shell-wrapper').innerHeight();
		//var contentheight = shellheight - (headerheight + footerheight);
		$('.shell-view-wrapper').css('top', headerheight);
		$('.shell-view-wrapper').css('bottom', footerheight);

		$('.viewer-container').css('height', $('.output-container').height());

		if (viewer && annoHost && !viewer.autoResize) {
			// We're handling viewer resizing ourselves. Let the ImagingHelper do it.
			annoHost.notifyResize();
		}
	}

	_$navExpanderHeaderContainer.on('click', null, function (event) {
		if (_navExpanderIsCollapsed) {
			_navExpanderExpand();
		}
		else {
			_navExpanderCollapse();
		}
	});

	function _navExpanderMakeResizable() {
		_$navExpander.resizable({
			disabled: false,
			handles: 'e, s, se',
			minWidth: 100,
			minHeight: 100,
			maxWidth: null,
			maxHeight: null,
			containment: '#theImageViewerContainer',
			resize: function (event, ui) {
				_navExpanderWidth = ui.size.width;
				_navExpanderHeight = ui.size.height;
				_navExpanderResizeContent();
			}
		});
	}

	function _navExpanderRemoveResizable() {
		_$navExpander.resizable('destroy');
	}

	function _navExpanderDoExpand(adjustresizable) {
		if (adjustresizable) {
			_navExpanderMakeResizable();
		}
		_$navExpander.width(_navExpanderWidth);
		_$navExpander.height(_navExpanderHeight);
		_$navExpanderContentContainer.show('fast', function () {
			_navExpanderResizeContent();
		});
		_$navExpander.css('opacity', _navExpanderExpandedOpacity);
	}

	function _navExpanderDoCollapse(adjustresizable) {
		_$navExpander.css('opacity', _navExpanderCollapsedOpacity);
		_$navExpanderContentContainer.hide('fast');
		_$navExpander.width(_navExpanderCollapsedWidth);
		_$navExpander.height(_navExpanderCollapsedHeight);
		_navExpanderResizeContent();
		if (adjustresizable) {
			_navExpanderRemoveResizable();
		}
	}

	function _navExpanderExpand() {
		if (_navExpanderIsCollapsed) {
			_navExpanderDoExpand(true);
			_navExpanderIsCollapsed = false;
		}
	}

	function _navExpanderCollapse() {
		if (!_navExpanderIsCollapsed) {
			_navExpanderDoCollapse(true);
			_navExpanderIsCollapsed = true;
		}
	}

	function _navExpanderResizeContent() {
		var wrapperwidth = _$navExpander.innerWidth();
		var wrapperheight = _$navExpander.innerHeight();
		var headerheight = _$navExpanderHeaderContainer ? _$navExpanderHeaderContainer.outerHeight(true) : 0;
		var newheight = wrapperheight - headerheight;
		_$navExpanderContentContainer.width(wrapperwidth);
		_$navExpanderContentContainer.height(newheight);
		viewer.navigator.updateSize();
		viewer.navigator.update(viewer.viewport);
	}

	var outputVM = {
		haveImage: ko.observable(false),
		haveMouse: ko.observable(false),
		imgWidth: ko.observable(0),
		imgHeight: ko.observable(0),
		imgAspectRatio: ko.observable(0),
		minZoom: ko.observable(0),
		maxZoom: ko.observable(0),
		osdContainerWidth: ko.observable(0),
		osdContainerHeight: ko.observable(0),
		osdZoom: ko.observable(0),
		osdBoundsX: ko.observable(0),
		osdBoundsY: ko.observable(0),
		osdBoundsWidth: ko.observable(0),
		osdBoundsHeight: ko.observable(0),
		osdMousePositionX: ko.observable(0),
		osdMousePositionY: ko.observable(0),
		osdElementOffsetX: ko.observable(0),
		osdElementOffsetY: ko.observable(0),
		osdMouseRelativeX: ko.observable(0),
		osdMouseRelativeY: ko.observable(0),
		osdTiledImageBoundsX: ko.observable(0),
		osdTiledImageBoundsY: ko.observable(0),
		osdTiledImageBoundsWidth: ko.observable(0),
		osdTiledImageBoundsHeight: ko.observable(0),
		zoomFactor: ko.observable(0),
		viewportWidth: ko.observable(0),
		viewportHeight: ko.observable(0),
		viewportOriginX: ko.observable(0),
		viewportOriginY: ko.observable(0),
		viewportCenterX: ko.observable(0),
		viewportCenterY: ko.observable(0),
		mousePositionX: ko.observable(0),
		mousePositionY: ko.observable(0),
		elementOffsetX: ko.observable(0),
		elementOffsetY: ko.observable(0),
		mouseRelativeX: ko.observable(0),
		mouseRelativeY: ko.observable(0),
		physicalToLogicalX: ko.observable(0),
		physicalToLogicalY: ko.observable(0),
		logicalToPhysicalX: ko.observable(0),
		logicalToPhysicalY: ko.observable(0),
		physicalToDataX: ko.observable(0),
		physicalToDataY: ko.observable(0),
		dataToPhysicalX: ko.observable(0),
		dataToPhysicalY: ko.observable(0),
		logicalToDataTLX: ko.observable(0),
		logicalToDataTLY: ko.observable(0),
		logicalToDataBRX: ko.observable(0),
		logicalToDataBRY: ko.observable(0),
		dataToLogicalTLX: ko.observable(0),
		dataToLogicalTLY: ko.observable(0),
		dataToLogicalBRX: ko.observable(0),
		dataToLogicalBRY: ko.observable(0)
	};

	// var svgOverlayVM = {
	// 	annoGroupTransform: annoGroupTransform
	// };

	var vm = {
		appTitle: ko.observable(appTitle),
		appDesc: ko.observable(appDesc),
		outputVM: ko.observable(outputVM)//,
		//svgOverlayVM: ko.observable(svgOverlayVM)
	};

	ko.applyBindings(vm);

}());
