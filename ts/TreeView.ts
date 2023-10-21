import {MemoryHelperEventListeners} from "j-memoryhelper-functions";
import { removeFromArrayAtIndex } from "j-object-functions";

/* eslint-disable @typescript-eslint/ban-types */
export function initTreeViewRecursively(htmlULElement: HTMLUListElement) {
	let treeViewItems = htmlULElement.querySelectorAll(
		":scope > li.tree-view-item"
	);

	treeViewItems.forEach((treeViewItem) => {
		let subTreeView = treeViewItem.querySelector(
			":scope > .tree-view-wrapper ul.tree-view"
		);
		if (subTreeView && subTreeView instanceof HTMLUListElement) {
			//toggle button
			const content = treeViewItem.querySelector(":scope > .content");
			if (!content) {
				throw new Error("Tree view item has no content");
			}
			const toggleSubTreeViewBtn = content.querySelector(
				".toggle-button-wrapper button.btn-expand-toggle"
			);

			const toggleSubTreeView = (): boolean => {
				let isExpanded = treeViewItem.classList.contains("expanded");
				let shouldBeExpanded = !isExpanded;
				if (shouldBeExpanded) {
					treeViewItem.classList.add("expanded");
				} else {
					treeViewItem.classList.remove("expanded");
				}
				return shouldBeExpanded;
			};
			if (toggleSubTreeViewBtn) {
				const toggleSubTreeViewBtnTxt =
					toggleSubTreeViewBtn.querySelector(".content");
				if (!toggleSubTreeViewBtnTxt) {
					throw new Error(
						"The toggleSubTreeViewBtn has not element with the class 'content'"
					);
				}

				toggleSubTreeViewBtn.addEventListener("click", (event) => {
					event.stopPropagation();
					toggleSubTreeView();
				});
			}
			//expand by clicking on .content
			content.addEventListener("click", (event) => {
				toggleSubTreeView();
			});
			initTreeViewRecursively(subTreeView);
		}
	});
}

export type TreeViewConent = TreeView;

export class TreeView {
	parentTreeViewItem: TreeViewItem | null;
	items: TreeViewItem[];
	constructor(options: { parentTreeViewItem?: TreeViewItem }) {
		this.items = new Array<TreeViewItem>();
		this.parentTreeViewItem = options.parentTreeViewItem ?? null;
	}
}

export type TreeViewItemToUpdateOrInsertConstructorOptions = {
	content: TreeViewItemContentConstructorOptions;
	nestedTreeView: TreeView | boolean;
	isExpanded?: boolean;
	isSelected?: boolean;
};
export class TreeViewItemToUpdateOrInsert {
	content: TreeViewItemContentConstructorOptions;
	nestedTreeView: TreeView | boolean;
	isExpanded?: boolean;
	isSelected?: boolean;

	constructor(options: TreeViewItemToUpdateOrInsertConstructorOptions) {
		this.content = options.content;
		this.nestedTreeView = options.nestedTreeView;
		this.isExpanded = options.isExpanded;
		this.isSelected = options.isSelected;
	}
}

export type TreeViewItemConstructorOptions = {
	treeViewPosition: TreeViewPosition;
	content: TreeViewItemContentConstructorOptions;
	parentTreeView: TreeView;
	nestedTreeView: TreeView | false;
	isExpanded?: boolean;
	isSelected?: boolean;
};
export class TreeViewItem {
	private _treeViewManager: TreeViewManager;
	content: TreeViewItemContent;
	parentTreeView: TreeView;
	nestedTreeView: TreeView | false;
	isExpanded: boolean;
	isSelected: boolean;

	constructor(
		options: TreeViewItemConstructorOptions,
		treeviewManager: TreeViewManager
	) {
		this.content = new TreeViewItemContent(options.content);
		this.parentTreeView = options.parentTreeView;
		this.nestedTreeView = options.nestedTreeView;
		this.isExpanded = options.isExpanded ?? false;
		this.isSelected = options.isSelected ?? false;
		this._treeViewManager = treeviewManager;
	}

	getTreeViewPosition(): TreeViewPosition {
		let currentTreeViewPosition: number[] = [];

		// eslint-disable-next-line @typescript-eslint/no-this-alias
		let currentTreeViewItem: TreeViewItem | null = this;
		while (currentTreeViewItem) {
			let indexInCurrentParentTreeView =
				currentTreeViewItem.parentTreeView.items.indexOf(currentTreeViewItem);
			currentTreeViewPosition.push(indexInCurrentParentTreeView);
			currentTreeViewItem =
				currentTreeViewItem.parentTreeView.parentTreeViewItem;
		}

		return currentTreeViewPosition.reverse();
	}

	toggleSubTreeView(active?: boolean) {
		let shouldBeExpanded = active ?? !this.isExpanded;

		let htmlTreeViewItem =
			this._treeViewManager.getHTMLRepresentationOfTreeTreeViewItemAtPosition(
				this.getTreeViewPosition()
			);

		if (!htmlTreeViewItem) {
			throw new Error(
				"Html representation of tree view item to toggle not found"
			);
		}

		const CLASSES = TreeViewManager.CLASSES.TREE_VIEW_ITEM_CLASSES;

		htmlTreeViewItem.classList.remove(CLASSES.STATUS.EXPANDED);
		htmlTreeViewItem.classList.remove(CLASSES.STATUS.RETRACTED);

		if (shouldBeExpanded) {
			htmlTreeViewItem.classList.add(CLASSES.STATUS.EXPANDED);
			this.isExpanded = shouldBeExpanded;
		} else {
			htmlTreeViewItem.classList.add(CLASSES.STATUS.RETRACTED);
			this.isExpanded = shouldBeExpanded;
		}
	}
}

export type TreeViewItemContentConstructorOptions = {
	toggleButton: boolean;
	selectCheckbox: boolean;
	title: string | false;
	customHTMLContent: HTMLElement | false;
};

export class TreeViewItemContent {
	toggleButton: boolean;
	selectCheckbox: boolean;
	title: string | false;
	customHTMLContent: HTMLElement | string | false;
	memoryHelperEventListeners: MemoryHelperEventListeners;

	constructor(options: TreeViewItemContentConstructorOptions) {
		this.toggleButton = options.toggleButton;
		this.selectCheckbox = options.selectCheckbox;
		this.title = options.title;
		this.customHTMLContent = options.customHTMLContent;
		this.memoryHelperEventListeners = new MemoryHelperEventListeners();
	}
}

export enum TreeViewItemHTMLElementType {
	SELECT_CHECKBOX_WRAPPER,
	SELECT_CHECKBOX,
	TITLE,
	TOGGLE_BUTTON_WRAPPER,
	TOGGLE_BUTTON,
	CUSTOM_HTML_CONTENT_WRAPPER,
	NESTED_TREE_VIEW_WRAPPER,
	NESTED_TREE_VIEW,
	CONTENT,
}

export type TreeViewPosition = Array<number>;

export class TreeViewManager {
	static CLASSES = {
		TREE_VIEW_ITEM_CLASSES: {
			CLASS: "tree-view-item",
			IS_NESTED: "nested",
			STATUS: {
				EXPANDED: "expanded",
				RETRACTED: "retracted",
			},
			CONTENT: {
				CLASS: "content",
				TOGGLE_BUTTON_WRAPPER: {
					CLASS: "toggle-button-wrapper",
					BUTTON: "btn-expand-toggle",
				},
				SELECT_CHECKBOX_WRAPPER: {
					CLASS: "select-wrapper",
					CHECKBOX: "select",
				},
				TITLE: {
					CLASS: "title",
				},
				CUSTOM_HTML_CONTENT_WRAPPER: {
					CLASS: "custom-html-content",
				},
			},
			TREE_VIEW_WRAPPER: "tree-view-wrapper",
		},
		TREE_VIEW: {
			CLASS: "tree-view",
		},
	};

	htmlElementTreeViewWrapper: HTMLElement;
	treeViewRoot: HTMLUListElement;
	treeViewContent: TreeViewConent;

	createEventListenerCallbacksForTreeViewItem = {
		content: {
			create: (options: { treeViewItem: TreeViewItem }) => {
				let treeViewItem = options.treeViewItem;
				return (event: Event) => {
					if (!treeViewItem) {
						console.warn(
							"BUG: content of tree view item was clicked, but tree view item doesnt exist anymore internally"
						);
						return;
					}
					treeViewItem.toggleSubTreeView();
				};
			},
			toggleButton: {
				create: (options: { treeViewItem: TreeViewItem }) => {
					return (event: Event) => {
						let treeViewItem = options.treeViewItem;
						event.stopPropagation();
						if (!treeViewItem) {
							console.warn(
								"BUG: Toggle button was clicked but tree view item doesnt exist anymore internally"
							);
							return;
						}
						treeViewItem.toggleSubTreeView();
					};
				},
			},

			selectCheckboxWrapper: {
				create: (options: {
					treeViewItem: TreeViewItem;
					selectCheckbox: HTMLInputElement;
				}) => {
					return (event: Event) => {
						event.preventDefault();
						event.stopPropagation();
						let treeViewItem = options.treeViewItem;
						let select_checkbox = options.selectCheckbox;
						if (!treeViewItem) {
							console.warn(
								"BUG: select checkbox was clicked but tree view item doesnt exist anymore internally"
							);
							return;
						}

						treeViewItem.isSelected = !treeViewItem.isSelected;
						select_checkbox.checked = treeViewItem.isSelected;
					};
				},
				selectCheckbox: {
					create: (options: {
						treeViewItem: TreeViewItem;
						selectCheckbox: HTMLInputElement;
					}) => {
						return (event: Event) => {
							event.stopPropagation();
							let treeViewItem = options.treeViewItem;
							let select_checkbox = options.selectCheckbox;

							if (!treeViewItem) {
								console.warn(
									"BUG: select checkbox was clicked but tree view item doesnt exist anymore internally"
								);
								return;
							}
							treeViewItem.isSelected = !treeViewItem.isSelected;
							select_checkbox.checked = treeViewItem.isSelected;
						};
					},
				},
			},
			customHTMLContentWrapper: {
				create: () => {
					return (event: Event) => {
						event.stopPropagation();
					};
				},
			},
		},
	};

	constructor(options: { htmlElementTreeViewWrapper: HTMLElement }) {
		this.htmlElementTreeViewWrapper = options.htmlElementTreeViewWrapper;
		let treeViewRoot =
			this.htmlElementTreeViewWrapper.querySelector("ul.tree-view-root");
		if (!treeViewRoot || !(treeViewRoot instanceof HTMLUListElement)) {
			throw new Error(
				"Tree view root in htmlElementTreeViewWrapper not found."
			);
		}
		this.treeViewRoot = treeViewRoot;
		this.treeViewContent = new TreeView({});
	}

	drawTreeViewAtPositionRecursively(treeViewPosition: TreeViewPosition) {
		//check if position exists
		let treeViewToDraw = this.getTreeViewAtPosition(treeViewPosition);
		if (treeViewToDraw === null) {
			throw new Error(
				`Cannot draw tree view at position: ${treeViewPosition.toString()}, because the position it not available.`
			);
		}

		let htmlTreeViewAtPosition =
			this.getHTMLRepresentationOfTreeTreeViewAtPosition(treeViewPosition);

		if (!htmlTreeViewAtPosition) {
			//add nested tree view to tree view wrapper in  html, because it didnt
			//had a nested tree view before
			htmlTreeViewAtPosition = this.createHTMLForTreeView(treeViewToDraw);

			let treeViewItemToAddNestedTreeView =
				this.getHTMLRepresentationOfTreeTreeViewItemAtPosition(
					treeViewPosition
				);
			if (!treeViewItemToAddNestedTreeView) {
				throw new Error("BUG: treeViewItemToAddNestedTreeView not found");
			}

			let treeViewWrapper = treeViewItemToAddNestedTreeView.querySelector(
				`:scope > .${TreeViewManager.CLASSES.TREE_VIEW_ITEM_CLASSES.TREE_VIEW_WRAPPER}`
			);
			if (!treeViewWrapper) {
				throw new Error(
					"The item where a tree view ul elmenent should be added doesnt have a treeViewWrapper."
				);
			}
			treeViewWrapper.appendChild(htmlTreeViewAtPosition);
		}
		//clear list
		htmlTreeViewAtPosition.innerHTML = "";

		let treeViewItems = treeViewToDraw.items;
		if (!treeViewItems.length) return;
		for (let index = 0; index < treeViewItems.length; index++) {
			const treeViewItem = treeViewItems[index];
			//create html content
			let htmlTreeViewItem = this.createHTMLForTreeViewItem(treeViewItem);
			let treeViewItemPosition = [...treeViewPosition, index];
			htmlTreeViewAtPosition.appendChild(htmlTreeViewItem);
			//check if there is a nested one
			if (treeViewItem.nestedTreeView) {
				this.drawTreeViewAtPositionRecursively(treeViewItemPosition);
			}
		}
	}

	redrawTreeViewItemAtPositionNotRecursively(
		treeViewPosition: TreeViewPosition
	) {
		let htmltreeViewItemToRedraw =
			this.getHTMLRepresentationOfTreeTreeViewItemAtPosition(treeViewPosition);
		if (!htmltreeViewItemToRedraw) {
			throw new Error(
				`Cannot redraw the tree view item at the position ${treeViewPosition.toString()}, because there is not tree view item in the html dom. You need to draw it first.`
			);
		}
		let treeViewItem = this.getTreeViewItemAtPosition(treeViewPosition);

		if (!treeViewItem) {
			throw new Error(
				`Cannot redraw the tree view item at the position ${treeViewPosition.toString()}, because there is not tree view item in the treeViewManager list.`
			);
		}
		let htmlTreeViewItem = this.createHTMLForTreeViewItem(treeViewItem);

		if (!(treeViewItem.nestedTreeView instanceof TreeView)) {
			htmltreeViewItemToRedraw.replaceWith(htmlTreeViewItem);
			return;
		}
		let old_nestedTreeView =
			this.getHTMLElementFromTreeViewItemAtPosition<HTMLUListElement>(
				treeViewPosition,
				TreeViewItemHTMLElementType.NESTED_TREE_VIEW
			);

		if (!old_nestedTreeView) {
			throw new Error("BUG: Old nested tree view not found to keep.");
		}

		htmltreeViewItemToRedraw.replaceWith(htmlTreeViewItem);

		let treeViewWrapper =
			this.getHTMLElementFromTreeViewItemAtPosition<HTMLDivElement>(
				treeViewPosition,
				TreeViewItemHTMLElementType.NESTED_TREE_VIEW_WRAPPER
			);
		if (!treeViewWrapper) {
			throw new Error(
				"BUG: Tree view wrapper of new tree view item not found."
			);
		}

		treeViewWrapper.append(old_nestedTreeView);
	}

	getHTMLElementFromTreeViewItemAtPosition<T extends Element>(
		treeViewPosition: TreeViewPosition,
		treeViewItemElementType: TreeViewItemHTMLElementType
	) {
		let treeViewItemHTML =
			this.getHTMLRepresentationOfTreeTreeViewItemAtPosition(treeViewPosition);
		if (!treeViewItemHTML) {
			throw new Error("Tree view item not found.");
		}
		return this.getHTMLElementFromTreeViewItem<T>(
			treeViewItemHTML,
			treeViewItemElementType
		);
	}

	getHTMLElementFromTreeViewItem<T extends Element>(
		htmlElementTreeviewItem: HTMLElement,
		treeViewItemElementType: TreeViewItemHTMLElementType
	): T | null {
		const CLASSES = TreeViewManager.CLASSES.TREE_VIEW_ITEM_CLASSES;
		switch (treeViewItemElementType) {
			case TreeViewItemHTMLElementType.CUSTOM_HTML_CONTENT_WRAPPER:
				return htmlElementTreeviewItem.querySelector<T>(
					`:scope >  .${CLASSES.CONTENT.CLASS} > .${CLASSES.CONTENT.CUSTOM_HTML_CONTENT_WRAPPER.CLASS}`
				);
				break;
			case TreeViewItemHTMLElementType.NESTED_TREE_VIEW_WRAPPER:
				return htmlElementTreeviewItem.querySelector<T>(
					`:scope > .${CLASSES.TREE_VIEW_WRAPPER}`
				);
				break;
			case TreeViewItemHTMLElementType.NESTED_TREE_VIEW:
				return htmlElementTreeviewItem.querySelector<T>(
					`:scope > .${CLASSES.TREE_VIEW_WRAPPER} > .${TreeViewManager.CLASSES.TREE_VIEW.CLASS}`
				);
				break;
			case TreeViewItemHTMLElementType.SELECT_CHECKBOX_WRAPPER:
				return htmlElementTreeviewItem.querySelector<T>(
					`:scope >  .${CLASSES.CONTENT.CLASS} > .${CLASSES.CONTENT.SELECT_CHECKBOX_WRAPPER.CLASS}`
				);
				break;
			case TreeViewItemHTMLElementType.SELECT_CHECKBOX:
				return htmlElementTreeviewItem.querySelector<T>(
					`:scope >  .${CLASSES.CONTENT.CLASS} > .${CLASSES.CONTENT.SELECT_CHECKBOX_WRAPPER.CLASS} > input.${CLASSES.CONTENT.SELECT_CHECKBOX_WRAPPER.CHECKBOX}`
				);
				break;
			case TreeViewItemHTMLElementType.CONTENT:
				return htmlElementTreeviewItem.querySelector<T>(
					`:scope >  .${CLASSES.CONTENT.CLASS}`
				);
				break;
			case TreeViewItemHTMLElementType.TITLE:
				return htmlElementTreeviewItem.querySelector<T>(
					`:scope >  .${CLASSES.CONTENT.CLASS} > .${CLASSES.CONTENT.TITLE.CLASS}`
				);
				break;
			case TreeViewItemHTMLElementType.TOGGLE_BUTTON_WRAPPER:
				return htmlElementTreeviewItem.querySelector<T>(
					`:scope >  .${CLASSES.CONTENT.CLASS} > .${CLASSES.CONTENT.TOGGLE_BUTTON_WRAPPER.CLASS}`
				);
				break;
			case TreeViewItemHTMLElementType.TOGGLE_BUTTON:
				return htmlElementTreeviewItem.querySelector<T>(
					`:scope >  .${CLASSES.CONTENT.CLASS} > .${CLASSES.CONTENT.TOGGLE_BUTTON_WRAPPER.CLASS} > button.${CLASSES.CONTENT.TOGGLE_BUTTON_WRAPPER.BUTTON}`
				);
				break;
			default:
				return null;
				break;
		}
	}

	initTreeViewItemAtPosition(treeViewPosition: TreeViewPosition) {
		let treeViewItem = this.getTreeViewItemAtPosition(treeViewPosition);
		if (!treeViewItem) {
			throw new Error(
				`Tree view item at position ${treeViewPosition.toString()} not found.`
			);
		}

		let htmlTreeViewItem =
			this.getHTMLRepresentationOfTreeTreeViewItemAtPosition(treeViewPosition);
		if (!htmlTreeViewItem) {
			throw new Error("Tree view item cannot be undefined");
		}

		const CLASSES = TreeViewManager.CLASSES.TREE_VIEW_ITEM_CLASSES;

		//toggle button
		const content = this.getHTMLElementFromTreeViewItem<HTMLDivElement>(
			htmlTreeViewItem,
			TreeViewItemHTMLElementType.CONTENT
		);

		if (!content) {
			throw new Error("Tree view item has no content");
		}

		if (treeViewItem.content.toggleButton) {
			const toggle_button =
				this.getHTMLElementFromTreeViewItem<HTMLButtonElement>(
					htmlTreeViewItem,
					TreeViewItemHTMLElementType.TOGGLE_BUTTON
				);

			if (!toggle_button) {
				throw new Error(
					"There is no toggle button in the tree view item, it should have one"
				);
			}

			toggle_button.addEventListener(
				"click",
				this.createEventListenerCallbacksForTreeViewItem.content.toggleButton.create(
					{ treeViewItem: treeViewItem }
				)
			);
		}

		if (treeViewItem.content.selectCheckbox) {
			const select_checkbox =
				this.getHTMLElementFromTreeViewItem<HTMLInputElement>(
					htmlTreeViewItem,
					TreeViewItemHTMLElementType.SELECT_CHECKBOX
				);
			if (!select_checkbox) {
				throw new Error(
					"There is no select checkbox in the tree view item, it should have one"
				);
			}

			select_checkbox.addEventListener(
				"click",
				this.createEventListenerCallbacksForTreeViewItem.content.selectCheckboxWrapper.selectCheckbox.create(
					{ treeViewItem: treeViewItem, selectCheckbox: select_checkbox }
				)
			);

			const select_checkbox_wrapper =
				this.getHTMLElementFromTreeViewItem<HTMLInputElement>(
					htmlTreeViewItem,
					TreeViewItemHTMLElementType.SELECT_CHECKBOX_WRAPPER
				);
			if (!select_checkbox_wrapper) {
				throw new Error(
					"There is no select checkbox wrapper in the tree view item, it should have one"
				);
			}
			select_checkbox_wrapper.addEventListener(
				"click",
				this.createEventListenerCallbacksForTreeViewItem.content.selectCheckboxWrapper.create(
					{ treeViewItem: treeViewItem, selectCheckbox: select_checkbox }
				)
			);
		}

		if (treeViewItem.content.customHTMLContent) {
			let customHTMLContentWrapper =
				this.getHTMLElementFromTreeViewItem<HTMLDivElement>(
					htmlTreeViewItem,
					TreeViewItemHTMLElementType.CUSTOM_HTML_CONTENT_WRAPPER
				);
			if (!customHTMLContentWrapper) {
				throw new Error(
					"Cannot set event listener on custom html content because it doesnt exist in the dom."
				);
			}
			if (
				!treeViewItem.content.memoryHelperEventListeners.getEventListenerByName(
					"CUSTOM_HTML_CONTENT_WRAPPER"
				)
			) {
				treeViewItem.content.memoryHelperEventListeners.addAndRegisterEventListener(
					{
						eventListenerFunction:
							this.createEventListenerCallbacksForTreeViewItem.content.customHTMLContentWrapper.create(),
						ownerOfEventListener: customHTMLContentWrapper,
						type: "click",
						name: "CUSTOM_HTML_CONTENT_WRAPPER",
					}
				);
			}
		}

		//expand by clicking on .content
		content.addEventListener(
			"click",
			this.createEventListenerCallbacksForTreeViewItem.content.create({
				treeViewItem: treeViewItem,
			})
		);
	}

	initTreeViewAtPositionRecursively(treeViewPosition: TreeViewPosition) {
		let treeViewAtPosition = this.getTreeViewAtPosition(treeViewPosition);
		if (!treeViewAtPosition) {
			throw new Error("No tree view at this position");
		}

		let treeViewItems = treeViewAtPosition.items;
		for (let index = 0; index < treeViewItems.length; index++) {
			let newPosition = structuredClone(treeViewPosition);
			newPosition.push(index);
			let treeViewItem = treeViewItems[index];
			this.initTreeViewItemAtPosition(treeViewItem.getTreeViewPosition());
			if (treeViewItem.nestedTreeView) {
				this.initTreeViewAtPositionRecursively(newPosition);
			}
		}
	}

	getHTMLForTreeViewContent(treeViewContentType: TreeViewItemHTMLElementType) {
		const TREE_VIEW_ITEM_CLASSES =
			TreeViewManager.CLASSES.TREE_VIEW_ITEM_CLASSES.CONTENT;

		switch (treeViewContentType) {
			case TreeViewItemHTMLElementType.CONTENT:
				let htmlContent = document.createElement("div");
				htmlContent.classList.add("content");
				return htmlContent;
				break;

			case TreeViewItemHTMLElementType.TOGGLE_BUTTON_WRAPPER:
				let toggleButtonWrapper = document.createElement("div");
				toggleButtonWrapper.classList.add(
					TREE_VIEW_ITEM_CLASSES.TOGGLE_BUTTON_WRAPPER.CLASS
				);
				return toggleButtonWrapper;
				break;
			case TreeViewItemHTMLElementType.TOGGLE_BUTTON:
				let toggleButton = document.createElement("button");
				toggleButton.classList.add(
					TREE_VIEW_ITEM_CLASSES.TOGGLE_BUTTON_WRAPPER.BUTTON
				);
				toggleButton.innerHTML = `<div class="content"></div>`;
				return toggleButton;
				break;
			case TreeViewItemHTMLElementType.SELECT_CHECKBOX_WRAPPER:
				let selectCheckboxWrapper = document.createElement("div");
				selectCheckboxWrapper.classList.add(
					TREE_VIEW_ITEM_CLASSES.SELECT_CHECKBOX_WRAPPER.CLASS
				);
				return selectCheckboxWrapper;
				break;
			case TreeViewItemHTMLElementType.SELECT_CHECKBOX:
				let selectCheckbox = document.createElement("input");
				selectCheckbox.setAttribute("type", "checkbox");
				selectCheckbox.classList.add(
					TREE_VIEW_ITEM_CLASSES.SELECT_CHECKBOX_WRAPPER.CHECKBOX
				);
				return selectCheckbox;
			case TreeViewItemHTMLElementType.TITLE:
				let title = document.createElement("div");
				title.classList.add(TREE_VIEW_ITEM_CLASSES.TITLE.CLASS);
				return title;
			default:
				return null;
		}
	}

	createHTMLForTreeViewItem(treeViewItem: TreeViewItem): HTMLLIElement {
		let htmlTreeViewItem = document.createElement("li");
		//Add expanded status
		htmlTreeViewItem.classList.add(
			TreeViewManager.CLASSES.TREE_VIEW_ITEM_CLASSES.CLASS
		);
		htmlTreeViewItem.classList.add(
			treeViewItem.isExpanded
				? TreeViewManager.CLASSES.TREE_VIEW_ITEM_CLASSES.STATUS.EXPANDED
				: TreeViewManager.CLASSES.TREE_VIEW_ITEM_CLASSES.STATUS.RETRACTED
		);
		//add content
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		let htmlContent = this.getHTMLForTreeViewContent(
			TreeViewItemHTMLElementType.CONTENT
		)!;

		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		let toggleButtonWrapper = this.getHTMLForTreeViewContent(
			TreeViewItemHTMLElementType.TOGGLE_BUTTON_WRAPPER
		)!;
		htmlContent.appendChild(toggleButtonWrapper);

		//Toggle button
		if (treeViewItem.content.toggleButton) {
			///toggle button wrapper
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			let toggleButton = this.getHTMLForTreeViewContent(
				TreeViewItemHTMLElementType.TOGGLE_BUTTON
			)!;
			toggleButtonWrapper.appendChild(toggleButton);
		} else {
			toggleButtonWrapper.classList.add("hidden");
		}

		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		let selectCheckboxWrapper = this.getHTMLForTreeViewContent(
			TreeViewItemHTMLElementType.SELECT_CHECKBOX_WRAPPER
		)!;
		htmlContent.appendChild(selectCheckboxWrapper);
		//Select Checkbox
		if (treeViewItem.content.selectCheckbox) {
			///select checkbox wrapper
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			let selectCheckbox = this.getHTMLForTreeViewContent(
				TreeViewItemHTMLElementType.SELECT_CHECKBOX
			)!;
			selectCheckboxWrapper.appendChild(selectCheckbox);
		} else {
			selectCheckboxWrapper.classList.add("hidden");
		}

		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		let title = this.getHTMLForTreeViewContent(
			TreeViewItemHTMLElementType.TITLE
		)!;
		htmlContent.appendChild(title);

		if (treeViewItem.content.title !== false) {
			///select checkbox wrapper
			title.innerHTML = treeViewItem.content.title;
		} else {
			title.classList.add("hidden");
		}

		if (treeViewItem.content.customHTMLContent) {
			///customHTMLContent
			///select checkbox wrapper
			let customHTMLContentWrapper = document.createElement("div");
			const CLASSES =
				TreeViewManager.CLASSES.TREE_VIEW_ITEM_CLASSES.CONTENT
					.CUSTOM_HTML_CONTENT_WRAPPER;
			customHTMLContentWrapper.classList.add(CLASSES.CLASS);

			if (treeViewItem.content.customHTMLContent instanceof Element) {
				customHTMLContentWrapper.appendChild(
					treeViewItem.content.customHTMLContent
				);
			} else {
				customHTMLContentWrapper.innerHTML =
					treeViewItem.content.customHTMLContent;
			}

			htmlContent.appendChild(customHTMLContentWrapper);
		}

		htmlTreeViewItem.appendChild(htmlContent);

		///create tree view wrapper
		let treeViewWrapper = document.createElement("div");
		const CLASSES = TreeViewManager.CLASSES.TREE_VIEW_ITEM_CLASSES;
		treeViewWrapper.classList.add(CLASSES.TREE_VIEW_WRAPPER);
		htmlTreeViewItem.appendChild(treeViewWrapper);

		if (treeViewItem.nestedTreeView) {
			//Set nested class
			htmlTreeViewItem.classList.add(
				TreeViewManager.CLASSES.TREE_VIEW_ITEM_CLASSES.IS_NESTED
			);
		}

		return htmlTreeViewItem;
	}

	createHTMLForTreeView(treeView: TreeView): HTMLUListElement {
		let htmlTreeView = document.createElement("ul");
		htmlTreeView.classList.add(TreeViewManager.CLASSES.TREE_VIEW.CLASS);
		return htmlTreeView;
	}

	getHTMLRepresentationOfTreeTreeViewAtPosition(
		treeViewPosition: TreeViewPosition
	): HTMLUListElement | null {
		let htmlPresentationOfTreeView: HTMLUListElement | null = null;

		htmlPresentationOfTreeView = this.treeViewRoot;

		for (let level = 0; level < treeViewPosition.length; level++) {
			if (!htmlPresentationOfTreeView) return null;

			let index = treeViewPosition[level];
			let treeViewItems: NodeListOf<HTMLLIElement> =
				htmlPresentationOfTreeView.querySelectorAll<HTMLLIElement>(
					`:scope > li.${TreeViewManager.CLASSES.TREE_VIEW_ITEM_CLASSES.CLASS}`
				);
			let item = treeViewItems[index];
			if (!item) {
				throw new Error(
					`No tree view item at index ${treeViewPosition.toString()}`
				);
			}

			htmlPresentationOfTreeView = item.querySelector<HTMLUListElement>(
				`:scope > .${TreeViewManager.CLASSES.TREE_VIEW_ITEM_CLASSES.TREE_VIEW_WRAPPER} > ul.${TreeViewManager.CLASSES.TREE_VIEW.CLASS}`
			);
		}

		return htmlPresentationOfTreeView;
	}

	getHTMLRepresentationOfTreeTreeViewItemAtPosition(
		treeViewPosition: TreeViewPosition
	): HTMLLIElement | null {
		let treeViewParentOfTreeViewItem =
			this.getHTMLRepresentationOfTreeTreeViewAtPosition(
				treeViewPosition.slice(0, treeViewPosition.length - 1)
			);

		if (!treeViewParentOfTreeViewItem) return null;

		let liElements =
			treeViewParentOfTreeViewItem.querySelectorAll<HTMLLIElement>(
				`:scope > li.${TreeViewManager.CLASSES.TREE_VIEW_ITEM_CLASSES.CLASS}`
			);

		let lastIndexOfTreeViewPosition = treeViewPosition.length - 1;
		let liElement = liElements[treeViewPosition[lastIndexOfTreeViewPosition]];
		if (!liElement) return null;
		return liElement;
	}

	setTreeViewItemAtPosition(
		treeViewItemToUpdateOrInsert: TreeViewItemToUpdateOrInsert,
		treeViewPosition: TreeViewPosition,
		draw = false
	) {
		let update = this.treeViewPositionIsAvailableToUpdate(treeViewPosition);
		let insert = this.treeViewPositionIsAvailableToInsert(treeViewPosition);

		if (!update && !insert) {
			throw new Error(
				"Tree view position is out of bounds. Cannot update or insert."
			);
		}

		if (insert) {
			this.insertTreeViewItemAtPosition(
				treeViewItemToUpdateOrInsert,
				treeViewPosition
			);
		} else if (update) {
			this.updateTreeViewItemAtPosition(
				treeViewItemToUpdateOrInsert,
				treeViewPosition
			);
		}
	}

	/**
	 * Inserts a tree view item at the given position.
	 *
	 * WARNING: It is currently not possible to insert nested tree views
	 * at the same time.
	 * @param treeViewItem
	 * @param treeViewPosition
	 * @returns
	 */
	insertTreeViewItemAtPosition(
		treeViewItem: TreeViewItemToUpdateOrInsert,
		treeViewPosition: TreeViewPosition
	) {
		if (!this.treeViewPositionIsAvailableToInsert(treeViewPosition)) {
			throw new Error("Tree view position is not available for insertion");
		}

		let treeViewWhereItemShouldBePlaced = this.getTreeViewAtPosition(
			treeViewPosition.slice(0, -1)
		);
		let lastIndexOfTreeViewPosition =
			treeViewPosition[treeViewPosition.length - 1];

		if (!treeViewWhereItemShouldBePlaced) {
			// Need to add it first
			let treeViewItemOf_treeViewWhereItemShouldBePlaced =
				this.getTreeViewItemAtPosition(treeViewPosition.slice(0, -1));

			if (!treeViewItemOf_treeViewWhereItemShouldBePlaced) {
				throw new Error(
					"Bug: treeViewItemOf_treeViewWhereItemShouldBePlaced was not found but it passed the treeViewPositionIsAvailableToInsert method."
				);
			}

			if (
				treeViewItemOf_treeViewWhereItemShouldBePlaced.nestedTreeView === false
			) {
				if (lastIndexOfTreeViewPosition !== 0) {
					throw new Error(
						"Bug: Tree view position must be 0 if a subtreeview does not exist, but it was not 0 and passed the chacking methods."
					);
				}

				//Add
				treeViewItemOf_treeViewWhereItemShouldBePlaced.nestedTreeView =
					new TreeView({
						parentTreeViewItem: treeViewItemOf_treeViewWhereItemShouldBePlaced,
					});

				treeViewWhereItemShouldBePlaced =
					treeViewItemOf_treeViewWhereItemShouldBePlaced.nestedTreeView;
			} else {
				throw new Error(
					"treeViewItemOf_treeViewWhereItemShouldBePlaced.nestedTreeView must be set to false but it passed the tests."
				);
			}
		}

		let nextFreeIndex = treeViewWhereItemShouldBePlaced.items.length;

		if (nextFreeIndex !== lastIndexOfTreeViewPosition) {
			throw new Error(
				`The index ${lastIndexOfTreeViewPosition} is out of bounds. Insert index would currently be ${nextFreeIndex}`
			);
			return false;
		}

		if (treeViewItem.nestedTreeView === true) {
			throw new Error(
				"Cannot take nested tree view in insert mode. nestedTreeView = false is not allowed"
			);
		}

		let treeViewItemToInsert = new TreeViewItem(
			{
				content: treeViewItem.content,
				nestedTreeView: false,
				parentTreeView: treeViewWhereItemShouldBePlaced,
				isExpanded: treeViewItem.isExpanded,
				isSelected: treeViewItem.isSelected,
				treeViewPosition: treeViewPosition,
			},
			this
		);

		treeViewWhereItemShouldBePlaced.items.push(treeViewItemToInsert);

		return true;
	}

	/**
	 * Updates a tree view item at the given position.
	 *
	 * WARNING: It is currently not possible to insert nested tree views
	 * at the same time.
	 *
	 * @param treeViewItem
	 * @param treeViewPosition
	 * @returns
	 */
	updateTreeViewItemAtPosition(
		treeViewItem: TreeViewItemToUpdateOrInsert,
		treeViewPosition: TreeViewPosition
	): boolean {
		if (!this.treeViewPositionIsAvailableToUpdate(treeViewPosition)) {
			throw new Error(
				"Tree view position is not available for an update. It does not exist."
			);
		}

		let treeViewWhereItemIsLocated = this.getTreeViewAtPosition(
			treeViewPosition.slice(0, -1)
		);

		if (!treeViewWhereItemIsLocated) {
			throw new Error("BUG: treeViewWhereItemIsLocated not found");
		}

		let lastIndexOfTreeViewPosition =
			treeViewPosition[treeViewPosition.length - 1];
		let oldTreeViewItem =
			treeViewWhereItemIsLocated.items[lastIndexOfTreeViewPosition];
		if (!oldTreeViewItem) {
			throw new Error(
				"Bug: Tree view item to update was not found. But it passed the treeViewPositionIsAvailableToUpdate method."
			);
		}
		let oldNestedSubTreeView: TreeView | false = oldTreeViewItem.nestedTreeView;

		let newNestedTreeView: TreeView | false = false;

		if (treeViewItem.nestedTreeView === true) {
			newNestedTreeView = oldNestedSubTreeView;
		} else if (treeViewItem.nestedTreeView instanceof TreeViewItem) {
			newNestedTreeView = treeViewItem.nestedTreeView;
		} else if (
			treeViewItem.nestedTreeView instanceof TreeViewItemToUpdateOrInsert
		) {
			newNestedTreeView = false;
		} else if (treeViewItem.nestedTreeView === false) {
			//Nothing
		}

		let newTreeViewItem = new TreeViewItem(
			{
				content: treeViewItem.content,
				nestedTreeView: newNestedTreeView,
				parentTreeView: treeViewWhereItemIsLocated,
				isExpanded: treeViewItem.isExpanded,
				isSelected: treeViewItem.isSelected,
				treeViewPosition: treeViewPosition,
			},
			this
		);

		//update back reference to make treeViewPosition discovery
		//possible
		if (newNestedTreeView instanceof TreeView) {
			newNestedTreeView.parentTreeViewItem = newTreeViewItem;
		}

		treeViewWhereItemIsLocated.items[lastIndexOfTreeViewPosition] =
			newTreeViewItem;

		return true;
	}

	treeViewItemPositionExists(treeViewPosition: TreeViewPosition) {
		let currentTreeViewItem: TreeViewItem | null =
			this.getTreeViewItemAtPosition(treeViewPosition);
		return currentTreeViewItem !== null;
	}

	removeTreeViewItemAtPosition(treeViewPosition: TreeViewPosition) {
		if (!this.treeViewItemExistsAtPosition(treeViewPosition)) {
			throw new Error("There is no tree view item at the given position.");
		}

		let parentTreeview = this.getTreeViewAtPosition(
			treeViewPosition.slice(0, -1)
		);

		if (!parentTreeview) {
			throw new Error("Bug: There is not tree view at the given position.");
		}
		let lastIndexOfTreeViewPosition =
			treeViewPosition[treeViewPosition.length - 1];

		parentTreeview.items = removeFromArrayAtIndex(
			parentTreeview.items,
			lastIndexOfTreeViewPosition
		);
	}

	removeTreeViewAtPosition(treeViewPosition: TreeViewPosition) {
		if (!this.getTreeViewAtPosition(treeViewPosition)) {
			throw new Error("There is no tree view at the given position.");
		}

		if (treeViewPosition.length == 0) {
			//Remove root tree view

			this.treeViewContent = new TreeView({});
			return true;
		}

		let treeViewItemWhereTreeViewIsLocated =
			this.getTreeViewItemAtPosition(treeViewPosition);
		if (!treeViewItemWhereTreeViewIsLocated) {
			throw new Error(
				`There is no tree view to remove at the position ${treeViewPosition.toString()}`
			);
		}

		treeViewItemWhereTreeViewIsLocated.nestedTreeView = false;
	}

	updateTreeViewContentFromItemAtPosition(
		treeViewPosition: TreeViewPosition,
		treeViewContent: Partial<TreeViewItemContentConstructorOptions>
	) {
		if (!this.treeViewItemExistsAtPosition(treeViewPosition)) {
			throw new Error(
				"Cannot update content of tree view item, because there is no tree view item at this position."
			);
		}

		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		let treeViewItem = this.getTreeViewItemAtPosition(treeViewPosition)!;
		let treeViewItemHTML =
			this.getHTMLRepresentationOfTreeTreeViewItemAtPosition(treeViewPosition);

		if (!treeViewItemHTML) {
			throw new Error("Tree view html not found");
		}

		if (treeViewContent.toggleButton !== undefined) {
			if (treeViewContent.toggleButton === true) {
				//update treeview item internally
				treeViewItem.content.toggleButton = true;

				let htmltoggleButton = this.getHTMLElementFromTreeViewItem(
					treeViewItemHTML,
					TreeViewItemHTMLElementType.TOGGLE_BUTTON
				);
				if (!htmltoggleButton) {
					//Toggle button doesnt exist yet. Add it
					let toggleButtonWrapper =
						this.getHTMLElementFromTreeViewItem<HTMLDivElement>(
							treeViewItemHTML,
							TreeViewItemHTMLElementType.TOGGLE_BUTTON_WRAPPER
						);
					if (!toggleButtonWrapper) {
						throw new Error(
							"BUG: The tree view content has not toggle button wrapper."
						);
					}

					let htmltoggleButton =
						// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
						this.getHTMLForTreeViewContent(
							TreeViewItemHTMLElementType.TOGGLE_BUTTON
						)!;

					toggleButtonWrapper.appendChild(htmltoggleButton);
					toggleButtonWrapper.classList.remove("hidden");

					htmltoggleButton.addEventListener(
						"click",
						this.createEventListenerCallbacksForTreeViewItem.content.toggleButton.create(
							{ treeViewItem: treeViewItem }
						)
					);
				}
			} else {
				treeViewItem.content.toggleButton = false;

				let htmltoggleButton = this.getHTMLElementFromTreeViewItem(
					treeViewItemHTML,
					TreeViewItemHTMLElementType.TOGGLE_BUTTON
				);

				if (htmltoggleButton) {
					//remove the toggle button
					htmltoggleButton.remove();
				}

				let toggleButtonWrapper =
					this.getHTMLElementFromTreeViewItem<HTMLDivElement>(
						treeViewItemHTML,
						TreeViewItemHTMLElementType.TOGGLE_BUTTON_WRAPPER
					);
				if (!toggleButtonWrapper) {
					throw new Error(
						"BUG: The tree view content has not toggle button wrapper."
					);
				}

				toggleButtonWrapper.classList.add("hidden");
			}
		}

		if (treeViewContent.selectCheckbox !== undefined) {
			if (treeViewContent.selectCheckbox === true) {
				//update treeview item internally
				treeViewItem.content.selectCheckbox = true;

				let htmlSelectCheckbox = this.getHTMLElementFromTreeViewItem(
					treeViewItemHTML,
					TreeViewItemHTMLElementType.SELECT_CHECKBOX
				);
				if (!htmlSelectCheckbox) {
					//Toggle button doesnt exist yet. Add it
					let selectCheckboxWrapper =
						this.getHTMLElementFromTreeViewItem<HTMLDivElement>(
							treeViewItemHTML,
							TreeViewItemHTMLElementType.SELECT_CHECKBOX_WRAPPER
						);
					if (!selectCheckboxWrapper) {
						throw new Error(
							"BUG: The tree view content has not select checkbox wrapper."
						);
					}

					let htmlSelectCheckbox =
						// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
						this.getHTMLForTreeViewContent(
							TreeViewItemHTMLElementType.SELECT_CHECKBOX
						)! as HTMLInputElement;

					selectCheckboxWrapper.appendChild(htmlSelectCheckbox);
					selectCheckboxWrapper.classList.remove("hidden");

					htmlSelectCheckbox.addEventListener(
						"click",
						this.createEventListenerCallbacksForTreeViewItem.content.selectCheckboxWrapper.selectCheckbox.create(
							{ selectCheckbox: htmlSelectCheckbox, treeViewItem: treeViewItem }
						)
					);
				}
			} else {
				treeViewItem.content.toggleButton = false;

				let htmlSelectCheckbox = this.getHTMLElementFromTreeViewItem(
					treeViewItemHTML,
					TreeViewItemHTMLElementType.SELECT_CHECKBOX
				);

				if (htmlSelectCheckbox) {
					//remove the toggle button
					htmlSelectCheckbox.remove();
				}

				let selectCheckboxWrapper =
					this.getHTMLElementFromTreeViewItem<HTMLDivElement>(
						treeViewItemHTML,
						TreeViewItemHTMLElementType.SELECT_CHECKBOX_WRAPPER
					);
				if (!selectCheckboxWrapper) {
					throw new Error(
						"BUG: The tree view content has not select checkbox wrapper."
					);
				}
				selectCheckboxWrapper.classList.add("hidden");
			}
		}

		if (treeViewContent.customHTMLContent !== undefined) {
			if (treeViewContent.customHTMLContent !== false) {
				//update treeview item internally
				treeViewItem.content.customHTMLContent =
					treeViewContent.customHTMLContent;

				//Toggle button doesnt exist yet. Add it
				let customHTMLContentWrapper =
					this.getHTMLElementFromTreeViewItem<HTMLDivElement>(
						treeViewItemHTML,
						TreeViewItemHTMLElementType.CUSTOM_HTML_CONTENT_WRAPPER
					);
				if (!customHTMLContentWrapper) {
					throw new Error(
						"BUG: The tree view content has no custom html content wrapper."
					);
				}

				if (typeof treeViewItem.content.customHTMLContent === "string") {
					customHTMLContentWrapper.innerHTML =
						treeViewItem.content.customHTMLContent;
				} else {
					customHTMLContentWrapper.appendChild(
						treeViewItem.content.customHTMLContent
					);
				}

				if (
					!treeViewItem.content.memoryHelperEventListeners.getEventListenerByName(
						"CUSTOM_HTML_CONTENT_WRAPPER"
					)
				) {
					treeViewItem.content.memoryHelperEventListeners.addAndRegisterEventListener(
						{
							eventListenerFunction:
								this.createEventListenerCallbacksForTreeViewItem.content.customHTMLContentWrapper.create(),
							ownerOfEventListener: customHTMLContentWrapper,
							type: "click",
							name: "CUSTOM_HTML_CONTENT_WRAPPER",
						}
					);
				}

				customHTMLContentWrapper.classList.remove("hidden");
			} else {
				treeViewItem.content.toggleButton = false;

				let htmlSelectCheckbox = this.getHTMLElementFromTreeViewItem(
					treeViewItemHTML,
					TreeViewItemHTMLElementType.SELECT_CHECKBOX
				);

				if (htmlSelectCheckbox) {
					//remove the toggle button
					htmlSelectCheckbox.remove();
				}

				let selectCheckboxWrapper =
					this.getHTMLElementFromTreeViewItem<HTMLDivElement>(
						treeViewItemHTML,
						TreeViewItemHTMLElementType.SELECT_CHECKBOX_WRAPPER
					);
				if (!selectCheckboxWrapper) {
					throw new Error(
						"BUG: The tree view content has not select checkbox wrapper."
					);
				}
				selectCheckboxWrapper.classList.add("hidden");
			}
		}

		if (treeViewContent.title !== undefined) {
			let titleHTML = this.getHTMLElementFromTreeViewItem<HTMLDivElement>(
				treeViewItemHTML,
				TreeViewItemHTMLElementType.TITLE
			);
			if (!titleHTML) {
				throw new Error("The tree view item content has no title.");
			}

			if (typeof treeViewContent.title === "string") {
				titleHTML.classList.remove("hidden");
				treeViewItem.content.title = treeViewContent.title;
				titleHTML.innerHTML = treeViewContent.title;
			} else {
				titleHTML.classList.add("hidden");
				titleHTML.innerHTML = "";
			}
		}
	}

	/**
	 * Returns the tree view item at the treeViewPosition
	 *
	 * [0, 1, 2] -> means:
	 *
	 * - Item 1 (Level 1)
	 * 	- Item 1 (Level 2)
	 * 	- Item 2 (Level 2)
	 * 		- Item 1 (Level 3)
	 * 		- Item 2 (Level 3)
	 *  	- Item 3 (Level 3) <- This is the selected one
	 * - Item 2 (Level 1)
	 * - Item 3 (Level 1)
	 * @param treeViewPosition an array of numbers (the index is the level and the number is the index at the level)
	 * @returns the tree view item at the position
	 */
	getTreeViewItemAtPosition(
		treeViewPosition: TreeViewPosition
	): TreeViewItem | null {
		let currentTreeViewItem: TreeViewItem | null =
			this.treeViewContent.items[treeViewPosition[0]]; //First Level (Level 0)
		for (let level = 1; level < treeViewPosition.length; level++) {
			if (currentTreeViewItem === null) return null;
			if (!(currentTreeViewItem instanceof TreeViewItem)) return null;
			let nestedTreeView: TreeView | false = currentTreeViewItem.nestedTreeView;
			if (!nestedTreeView) {
				return null;
			}
			let index = treeViewPosition[level];
			if (index < 0 || index > nestedTreeView.items.length) {
				return null;
			}
			currentTreeViewItem = nestedTreeView.items[index];
		}
		if (!currentTreeViewItem) return null;
		if (!(currentTreeViewItem instanceof TreeViewItem)) return null;
		return currentTreeViewItem;
	}
	/**
	 * Returns the tree view  at the treeViewPosition
	 *
	 * - [] -> 	Means the root tree view
	 * - [1] -> Means the tree view from the item with the index
	 * 			1 in the root tree view (sub-treeview)
	 *
	 * @param treeViewPosition an array of numbers (the index is the level
	 * 	and the number is the index at the level).
	 * 	It takes the item at the selected position and returns the subTreeView of
	 * 	the item
	 * @returns the tree view item at the position or null if it does not exist
	 */
	getTreeViewAtPosition(treeViewPosition: TreeViewPosition): TreeView | null {
		let currentTreeView: TreeView | null = this.treeViewContent; //First Level (Level 0)
		for (let level = 0; level < treeViewPosition.length; level++) {
			let index = treeViewPosition[level];
			if (index < 0 || index > currentTreeView.items.length) {
				return null;
			}
			let currentTreeViewItem: TreeViewItem | null =
				currentTreeView.items[index];

			if (currentTreeViewItem === null) return null;
			if (!(currentTreeViewItem instanceof TreeViewItem)) return null;
			let nestedTreeView: TreeView | false = currentTreeViewItem.nestedTreeView;
			if (!nestedTreeView) {
				return null;
			}

			currentTreeView = nestedTreeView;
		}
		if (currentTreeView === null) return null;
		if (!(currentTreeView instanceof TreeView)) return null;
		return currentTreeView;
	}

	/**
	 * Returns a boolean wether the position is available to update an item
	 * of the tree view if one of the following conditions are met:
	 *
	 *  + Root tree view always exists.
	 *
	 *
	 * 1. Tree view item that should be updated exist
	 *
	 *
	 * @param treeViewPosition
	 * @returns true if position is available to insert
	 */
	treeViewPositionIsAvailableToUpdate(
		treeViewPosition: TreeViewPosition
	): boolean {
		return this.treeViewItemExistsAtPosition(treeViewPosition);
	}

	treeViewItemExistsAtPosition(treeViewPosition: TreeViewPosition): boolean {
		let treeViewItemAtTreeViewPosition =
			this.getTreeViewItemAtPosition(treeViewPosition);
		if (!treeViewItemAtTreeViewPosition) return false;

		return true;
	}

	/**
	 * Returns a boolean wether the position is available to insert an item
	 * to the tree view if one of the following conditions are met:
	 *
	 *  + Root tree view always exists.
	 *
	 *
	 * 1. Tree view where the item should be inserted exists
	 * and the next free index is the last index in the tree
	 * view position.
	 *
	 * 2. Tree view where the item should be inserted does not
	 * exist. The parent of the tree view (from the item to insert),
	 * which is a tree view item, has the nestedTreeViewValue set to
	 * false and the last index in the tree view position is 0
	 *
	 * @param treeViewPosition
	 * @returns true if position is available to insert
	 */
	treeViewPositionIsAvailableToInsert(
		treeViewPosition: TreeViewPosition
	): boolean {
		//1.
		let treeViewWhereItemShouldBePlaced = this.getTreeViewAtPosition(
			treeViewPosition.slice(0, -1)
		);
		let lastIndexOfTreeViewPosition =
			treeViewPosition[treeViewPosition.length - 1];

		if (!treeViewWhereItemShouldBePlaced) {
			//2.
			let treeViewItemOf_treeViewWhereItemShouldBePlaced =
				this.getTreeViewItemAtPosition(treeViewPosition.slice(0, -1));

			if (!treeViewItemOf_treeViewWhereItemShouldBePlaced) {
				return false;
			}

			if (
				treeViewItemOf_treeViewWhereItemShouldBePlaced.nestedTreeView === false
			) {
				if (lastIndexOfTreeViewPosition === 0) return true;
			}

			return false;
		}

		let nextFreeIndex = treeViewWhereItemShouldBePlaced.items.length;

		if (nextFreeIndex !== lastIndexOfTreeViewPosition) {
			return false;
		}

		return true;
	}
}
