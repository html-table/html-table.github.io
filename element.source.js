//TODO
// paging make work
// hide Link hidden column
// set column width with width on <column>
// specify lines to ignore (header rows)
// vertical table (2 column list) like from beers API
// Nested table details/summary: https://baseweb.design/components/table-grid/
//DOING
// remove groupby sets ps to 0
// select red filter: undo all other filters
// when groupby set select size to only show one red item
// ctrl click on cell value as filter on that value?
//DONE
// select all shouldn't color select
// color grouped selects

// resources
//https://ivosdc.github.io/svelte-generic-crud-table/?ref=madewithsvelte.com
//https://jsonmatic.com/
console.clear();

const GoogleAPIversion = "v4";
const GoogleAPIversionV4 = GoogleAPIversion == "v4";

console.do = (...args) => {
  console.log(
    `%c ${typeof args[0] == "string" ? args.shift() : ""} `,
    `background:purple;color:gold`,
    ...args
  );
};

/*
  <google-sheet>
  attributes:
    sheetid - sheetid of PUBLISHED spreadsheet
    sheettab - tabname
    apikey - public Google API key

    Load JSON data, convert to Array, store in own memory
    respond to Event, return array
*/
customElements.define(
  "google-sheet",
  class extends HTMLElement {
    constructor() {
      super();
      this._headers = false;
      this._rows = false;
    }
    connectedCallback() {
      document.addEventListener("alldata", this.respond);
      document.addEventListener(this.id, this.respond);
      //fetch and create data
    }
    get rows() {
      return this._rows;
    }
    set rows(rowsarray) {
      this._rows = [...rowsarray];
    }
    respond(evt) {
      let callbackFunc = evt.detail?.callback;
      if (this._rows && callbackFunc) callbackFunc(this);
    }
  }
);

/*
  <html-table>
*/
customElements.define(
  "html-table",
  class extends HTMLElement {
    constructor() {
      super().attachShadow({
        mode: "open",
      }).innerHTML = `${
        document.getElementById(this.nodeName + "-STYLE").innerHTML
      }<style id=show></style><style id=filter></style>`;
      this._t = this.query("table");
      this._f = this.query("#filter");
      this._s = this.query("#show");
      //load from id
      //filter
      //paging
      //get row
      //(multiple) select
      //sort up/down columns
      //rocognize date notation
      //pages <option>10</option> rows per page, n-m of 55  << < > >>
      this.columns = {};
    }
    query(selector, root = this.shadowRoot) {
      return (root || this).querySelector(selector);
    }
    connectedCallback() {
      let timersthis = this;
      console.timers = new Proxy([{ label: "start", time: 0, duration: 0 }], {
        set(arr, prop, label) {
          //console.log(prop,label);
          if (!timersthis.hasAttribute("timers")) return true;
          if (prop != "length") {
            label = String(label);
            let previous = arr.slice(-1)[0];
            let time = Number(performance.now().toFixed(0));
            arr[prop] = {
              label,
              time: label.includes("*") ? 0 : time,
              duration: time - previous.time,
            };
            if (label.includes("*")) console.table(arr, ["label", "duration"]);
          }
          return true;
        },
      });
      this.json1 = [
        {
          naam: "Danny",
          age: 52,
          gender: "Male",
        },
        {
          naam: "Marcel",
          age: 49,
          gender: "Male",
        },
        {
          naam: "Diny",
          age: 76,
          gender: "Female",
        },
        {
          naam: "Kees",
          age: 77,
          gender: "Male",
        },
        {
          naam: "Cecile",
          age: 59,
          gender: "Female",
        },
        {
          naam: "Natascha",
          age: 48,
          gender: "Female",
        },
        {
          naam: "Finn",
          age: 17,
          gender: "Male",
        },
        {
          naam: "Kiki",
          age: 15,
          gender: "Female",
        },
      ];
      if (this.json) {
        this.load(this.json);
        return;
      }
      setTimeout(async () => {
        this.for = this.getAttribute("for");
        this.shadowRoot.append(...this.querySelectorAll("[shadowRoot]"));
        if (this.for) {
          if (this.for.length == 44) {
            if (GoogleAPIversionV4) {
              let spreadsheetID = this.for;
              let APIkey = "AIzaSyCGmrJTJI2lNsMM22RfHUoKVhRATmNkMtM"; // from personal Google Cred
              let tabName = "Groceries";
              //tabName=0;
              this.for = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetID}/values/${tabName}?alt=json&key=${APIkey}`;
            } else
              this.for = `https://spreadsheets.google.com/feeds/list/${this.for}/od6/public/values?alt=json`;
          }

          this.loadJSON(this.for);
        } else {
          console.error("no for");
          return;
        }
      }); // setTimeout
    } // connectedCallback
    async loadJSON(source) {
      if (source.startsWith("http")) {
        let response = await (await fetch(source)).json();
        console.timers.push("loaded JSON");
        let headerRow = this.getAttribute("headerrow") || 0;
        let isGoogle = source.includes("google");
        // find first property which is an array
        let rows = response;
        this.headers = {};
        if (isGoogle) {
          if (GoogleAPIversionV4) {
            rows = response.values;
            this.headers = rows.shift();
            let newrows = rows.map((row) => {
              let objRow = {};
              this.headers.forEach((header, idx) => {
                if (header == "Order") row[idx] = String(row[idx]).padStart(3, "0");
                objRow[header] = row[idx];
              });
              return objRow;
            });
            rows = [this.headers, ...newrows];
            rows = newrows;
          } else rows = response.feed.entry;
        }
        // find first property being an Array
        if (!Array.isArray(rows)) {
          console.warn("converting Object to Array", rows);
          rows = [...Object.entries(rows)].reduce((rowACC, [key, value]) => {
            if (!Array.isArray(rowACC) && Array.isArray(value)) return value;
            else return rowACC;
          }, rows);
        }
        if (!Array.isArray(rows)) {
          console.error("No array found in response ", response);
          return;
        }
        console.log(21, headerRow, this.headers, rows[1]);
        console.do("parsed response to rows ", {
          response,
          rows,
          headers: this.headers,
        });

        rows = rows.slice(headerRow, 9999).map((row) => {
          if (isGoogle && !GoogleAPIversionV4)
            // rewrite all Google gsx$ keys to string and collect columheader titles in this.headers
            Object.entries(row).map(([key, arr], newkey) => {
              // abuse idx as newkey
              // newkey = columnname or undefined
              if ((newkey = key.split("gsx$")[1])) {
                //console.do(key,newkey,{...row});
                // if we know the columnname
                if (this.headers[newkey]) newkey = this.headers[newkey];
                // store new columnname
                else this.headers[newkey] = newkey; // store columnname TODO translate columnname
                // store row[key]=value pair
                row[newkey] = arr.$t;
              }
              delete row[key]; // delete key from row Object
            });
          //console.do("headers", { headers: this.headers });
          // now check if this record has any undefined (empty) cells
          //Object.values(this.headers).map((key) => (row[key] ? key : (row[key] = "")));
          return row;
        });
        this.load(rows);
      } else {
        let el =
          this.query("#" + source, document) ||
          this.query("#" + source, this.getRootNode().host);
        if (el) {
          // parse JSON from el.innerHTML
          try {
            this.load(JSON.parse(el.innerHTML));
          } catch (e) {
            console.error(e);
          }
        }
        document.addEventListener(source, (evt) => {
          let rows = evt.detail.rows;
          this.load(rows);
        }); // addEventListener
      } // else for= string
    }
    get show() {
      this.getAttribute("show");
    }
    set show(v = "*") {
      this.setAttribute("show", v);
      this._s.innerHTML = `tbody tr[data-article*="${v}"]{background:lightgreen}`;
      console.warn("set show", this._s.innerHTML);
    }
    row(selector) {}
    TRtoggle(state, TR) {
      if (typeof TR == "number") TR = this.row(TR);
    }
    parseStr = (str, v = {}) => {
      return new Function(
        "v",
        "return((" +
          Object.keys(v).join(",") +
          ")=>`" +
          str +
          "`)(...Object.values(v))"
      )(v);
    };

    //! **************************************************** convert JSON to HTML Table
    set source(val) {
      console.warn(val);
    }
    //! **************************************************** convert JSON to HTML Table
    load(json, columnDefinitions = this.querySelector("#columns")) {
      //json = json.slice(0, 3);
      console.timers.push("parsed JSON");
      if (json.headers)
        console.do(
          "json headers",
          { headers: this.headers },
          { row0: json[0] }
        );

      // ================================================== init <template id="columns">
      // <column_title> (unknown) Elements for column string definition
      if (columnDefinitions)
        [...columnDefinitions.content.children].map(
          //get all children in <html-table> lightDOM
          (tmpl) =>
            (this.columns[tmpl.getAttribute("name") || tmpl.localName] =
              tmpl.innerHTML // store string for template literal parsing
                .split("\n") //        cleanup string whitespace
                .map((x) => x.trim())
                .join(""))
        );
      console.do("config columns: ", Object.keys(this.columns));

      // ==================================================
      if (json.length) {
        // add default columns to JSON
        json = json.map((row) => ({
          sel: (this.columns.sel || "") + "<input type='checkbox'>",
          ...row,
        }));
        // delete existing selected key/value?
        // if no this.headers, add keys from [0] at start of JSON array
        // if (Object.keys(this.headers || {}).length == 0) {
        //   console.do("add first row keys as headers",json[0])
        //   json.unshift(Object.keys(json[0]));
        // }

        // if keys from records in row0 and row1 are equal
        if (
          json.length > 1 &&
          new Set(Object.keys(json[0]), Object.keys(json[1])).size ==
            Object.keys(json[0]).length
        ) {
          // row0 is NOT a header row and set row0 keys as header row
          json.unshift(Object.keys(json[0]));
        }
        // ================================================ built <table>
        // build table from bottom to top, so THEAD info (rowindex==0) is processed LAST
        this.$table = json.reduceRight(
          (
            TM, // TableManager Object! {}
            row,
            rowindex, // reduceRight does highest to 0
            allrowsArray, // =json array

            //! savelet: now sneak in our own functions and variables
            totalrows = allrowsArray.length - 1,
            $pagesizes = (this.getAttribute("pagesizes") || "5,10,20,30,40")
              .split`,`.concat(totalrows),
            $pagesize = this.getAttribute("pagesize") || Number($pagesizes[0]),
            $pagesizeMargin = 3, // when groupedRowCount has this count more rows, then display all
            //doc ----------------------------------------- columns
            $excludecolumns = (this.getAttribute("excludecolumns") || "").split(
              ","
            ),
            $includecolumns = (this.getAttribute("includecolumns") || "").split(
              ","
            ),
            includeColumn = (colname) => {
              let exclude = $excludecolumns.includes(colname);
              let include = $includecolumns.includes(colname);
              return ($excludecolumns == "*" && include) || include || !exclude;
            },
            //doc ----------------------------------------- processRow
            processRow = (func) => Object.entries(row).map(func),
            // generic create TAG
            TAG = (tag, val, key, el = document.createElement(tag)) => {
              //DELval = this.headers[val] || val; YES DEL
              if (val) {
                if (typeof val == "string") {
                  el.setAttribute("data-value", (el.innerHTML = val));
                } else {
                  el.append(...[val]);
                }
              }
              if (key) {
                el.setAttribute("data-colname", key);
                el.setAttribute("aria-rowindex", rowindex);
                TR.append(el);
              }
              return el;
            },
            TR = TAG("tr")
          ) => {
            if (rowindex) {
              // rows N downto 1 are data rows
              TR.row = row; // add data as property on TR
              TR.setAttribute("role", "row");
              TR.setAttribute("aria-roleindex", rowindex);
              TR.setAttribute("data-index", rowindex); // used in parser to find first/startRow TR rowindex
              if (rowindex == 1) {
                console.do("parsed columns:");
                console.groupCollapsed("➷", { row });
              }
              processRow(([colname, value], colnr) => {
                //doc ---------------------------------------- if column has template
                if (this.columns[colname]) {
                  // if defined in <TEMPLATE id="columns"
                  // parse that innerHTML as template literal
                  value = this.parseStr(this.columns[colname], {
                    rowindex,
                    colname,
                    value,
                    colindex: colnr,
                    total: totalrows,
                    ...row,
                  });
                  if (rowindex == 1)
                    console.do(
                      `name: ${colname}\ninput : ${this.columns[colname]} \n result: ${value}`
                    );
                } // if column template exists
                // ---------------------------------------- if value not string
                if (typeof value != "string") {
                  if (Array.isArray(value)) {
                    let subtable = document.createElement(this.localName); // <html-table>
                    subtable.json = value;
                    // valueIsTable = true;
                    value = subtable;
                  } else if (typeof value == "number") {
                    value = Number(value);
                  } else {
                    value = typeof value;
                  }
                } // if not string
                // ---------------------------------------- built TD
                let THTD = TAG(colnr == 0 ? "th" : "td", value, colname);
                let subtable; // nested <html-table>
                THTD.setAttribute("role", "cell");
                THTD.setAttribute("data-isnumber", Number(value) == value);
                THTD.setAttribute("data-colnr", colnr);
                THTD.setAttribute("title", value);
                TR.setAttribute("data-" + colname, value);
                if (subtable) THTD.setAttribute("is-table", colname);
                // ---------------------------------------- only for colnr > 0
                if (colnr) {
                  // grouping distinct values
                  if (!TM.columns.get(colname))
                    TM.columns.set(colname, new Map());
                  if (!TM.columns.get(colname).get(value))
                    TM.columns.get(colname).set(value, []);
                  // storing distinct values
                  TM.columns.get(colname).get(value).push(row);
                  //! there is no TH yet to store values on!
                } // if (colnr)
              }); // processRow() function item rows
              if (rowindex == 1) console.groupEnd();

              // ---------------------------------------- TR selected state
              TR.toggle = (state = !TR.querySelector("input").checked) => {
                TR.querySelector("input").checked = state;
                TR.classList.toggle("selected", state);
              };
              TR.onclick = (evt) => {
                if (evt.target.nodeName != "INPUT") TR.toggle();
                // TODO Emit CustomEvent
              };
              // ---------------------------------------- add TR (reduceRight so prepend/unshift)
              TM.TRs.unshift(TR);
              //TM.tbody.prepend(TR);
              // ---------------------------------------- end data row cells
            } else {
              // ---------------------------------------- create THEAD
              let previousTH; // make every TH point to TH.next TH
              processRow(([name, columnname], colnr, columns) => {
                let THHEADER = TAG("div", columnname);
                let THSTYLE = TAG("style");
                let TH = TAG("th", THHEADER, columnname);
                let GROUPSELECT = TAG("select", ``);
                let _unsorted;
                let RESIZEDIV = TAG("div");
                // ---------------------------------------- built <option> for TH.grouped
                let option;
                let columnValuesMap = TM.columns.get(columnname);
                TH.colname = columnname; // used by sort
                TH.id = this.id + "_" + columnname;
                //DELTH.groupbyselect = GROUPSELECT;
                TH.append(THSTYLE, RESIZEDIV);
                TH.header = THHEADER; //! point to header <DIV> So sorted can find it
                // ---------------------------------------- //! keep track of all headers by columnname
                TM.THs.push(TH);
                TM.groupby.push(GROUPSELECT);
                // ---------------------------------------- // aria
                TH.setAttribute("role", "columnheader");
                TH.setAttribute("aria-label", columnname);
                TH.setAttribute("aria-colindex", colnr);
                //TODO process column settings log(columnname,this.columns[columnname]);

                // ------------------------------------------ distinct values filter ###
                TH.update = (setOptionColors = false) => {
                  if (!columnValuesMap) return;
                  // ---------------------------------------- GROUPSELECT add 2 or more options if there are
                  let OPTIONTAG;
                  let optionLabel = (str, len) => `(${len}) ` + str; // MINIFY: used once
                  let optionTAG = (str, arr) => {
                    option = TAG("option", optionLabel(str, arr.length));
                    option.setAttribute("value", str);
                    return option;
                  };
                  let valuesInSelection = TM.selected.map(
                    (TR) => TR.row[columnname]
                  );
                  //! save value because OPTION DOM is replaceChildrened
                  let savedSelectValue = GROUPSELECT.value || "*";
                  //TODO?? GROUPSELECT.id = "group_" + columnname;
                  GROUPSELECT.replaceChildren(
                    // first <OPTION>: select all
                    optionTAG("*", TH.values),
                    // rest <OPTION>s
                    ...[...columnValuesMap.entries()]
                      .map(([str, arr]) => {
                        OPTIONTAG = optionTAG(str, arr);
                        if (setOptionColors)
                          OPTIONTAG.setAttribute(
                            "inselection",
                            valuesInSelection.includes(str)
                          );
                        else OPTIONTAG.removeAttribute("inselection");
                        return OPTIONTAG;
                      })
                      // determine which OPTIONs are in- or out-side grouped selection
                      .reduceRight(
                        (
                          options,
                          option,
                          idx,
                          arr,
                          //savelet:
                          group = (
                            i,
                            //savelet
                            OPTGROUP = document.createElement("optgroup")
                          ) => {
                            OPTGROUP.setAttribute(
                              "label",
                              "¥Y"[i] + " (" + options[i].length + ")"
                            );
                            OPTGROUP.append(
                              ...options[i].sort((x, y) =>
                                x.value.localeCompare(y.value)
                              )
                            );
                            return (options[i] = options[i].length
                              ? OPTGROUP
                              : "");
                          }
                        ) => {
                          options[
                            option.getAttribute("inselection") == "false"
                              ? 0
                              : 1
                          ].unshift(option); //! unshift because of reduceRight
                          return idx ? options : [group(1), group(0)];
                        }, // end reduceRight function body
                        // reduceRight accumulator:
                        [[], []] // IN selection and OUT selection arrays for <OPTION>s
                      ) // end reduceRight
                  ); //GROUPSELECT.replaceChildren
                  GROUPSELECT.value = savedSelectValue;
                  //GROUPSELECT.querySelector('[value="'+savedSelectValue+'"]').scrollIntoView();
                  GROUPSELECT.options[0].scrollIntoView();
                }; // TH.update

                // -------------------- only for columns with values...
                if (columnValuesMap) {
                  // all column values ?? check perfomance
                  //! group and count values txt(n)
                  TH.values = [...columnValuesMap.values()]
                    .flatMap((row) => row)
                    .map((row) => row[columnname]);
                  TH.update();
                  // ---------------------------------------- // mark column if all Numbers
                  TH.setAttribute(
                    "data-isnumber",
                    (TH.isNumber = TH.values.every((v) => Number(v) == v))
                  );
                  GROUPSELECT.classList.add("columnfilter");
                  GROUPSELECT.setAttribute("size", 15);
                  GROUPSELECT.setAttribute("data-colname", columnname);
                  TH.append(GROUPSELECT);
                  GROUPSELECT.onchange = () => TH.groupby(GROUPSELECT.value);
                }
                // ---------------------------------------- resizable columns
                //! set pointer on Previous column to here
                if (colnr) previousTH.next = TH;
                previousTH = TH;
                TH.setwidth = (x) => (TH.style.width = x + "px");
                RESIZEDIV.style =
                  "top:0;right:0;width:5px;position:absolute;cursor:col-resize;user-select:none;height:100%";
                var pageX, resizingColumn, curColWidth, nxtColWidth;
                // TODO DETERMINE NEXT "VISIBLE" column
                // TODO save column width in localStorage
                RESIZEDIV.onmousedown = (e) => {
                  resizingColumn = TH;
                  pageX = e.pageX;
                  curColWidth = resizingColumn.offsetWidth;
                  if (resizingColumn.next)
                    nxtColWidth = resizingColumn.next.offsetWidth;
                };
                // TODO move into onmousedown so it doesn't listen always
                this.addEventListener("mousemove", (e) => {
                  if (resizingColumn) {
                    if (resizingColumn.next)
                      resizingColumn.next.setwidth(
                        nxtColWidth - (e.pageX - pageX)
                      );
                    resizingColumn.setwidth(curColWidth + (e.pageX - pageX));
                  }
                });
                this.addEventListener(
                  "mouseup",
                  (e) => (pageX = nxtColWidth = curColWidth = undefined)
                );

                //----------------------------------------  filter column ###
                TH.groupby = (groupValue) => {
                  if (TH.values.includes(groupValue)) {
                    TM.grouped[columnname] = groupValue;
                    TM.pager("groupby:" + columnname);
                    THSTYLE.innerHTML =
                      `select[data-colname="${columnname}"]` +
                      //CSS can not style option ` option[data-value*="${groupValue}"]`+
                      `{background:var(--filterColor,#9cc)}`;
                  } else {
                    THSTYLE.innerHTML = ``;
                    delete TM.grouped[columnname];
                    TM.pager();
                  }
                  //! pager *replaces* OPTION DOM elements so set value after all is done
                  GROUPSELECT.value = groupValue;
                };
                //doc ---------------------------------------- sort column ###
                TH.sorted = 0; //1 asc 2 desc 0
                TH.sort = (
                  state = ++TH.sorted, // inc. 0,1,2 when not specified
                  singleColumnSort = 1 // ctrl key sorts multiple columns
                ) => {
                  if (state > 2) TH.sorted = 0; // 0,1,2
                  if (singleColumnSort) {
                    // ctrl click sorts on multiple columns
                    TM.THs.map((THc) => TH != THc && (THc.sorted = 0)); // reset all columns
                  }
                  startRow = 1; // every sort resets page position
                  TM.pager(); // update page state
                };
                THHEADER.onclick = (evt) =>
                  TH.sort(
                    ++TH.sorted, // increase 0,1,2 sort state
                    !evt.ctrlKey // send ctrl key, sorts multiple columns
                  );

                //doc ---------------------------------------- end TH
              }); // end processRow() function call

              //doc ---------------------------------------- init pager()
              let startRow = this.getAttribute("rowindex") || 1; // reset by TM.pager()
              let pageTAG = (
                arrow,
                // savelet:
                BTAG = TAG(
                  "b",
                  "&nbsp;&nbsp;" + "de«‹›»"[arrow] + "&nbsp;&nbsp;"
                ),
                CLICK = (BTAG.onclick = () =>
                  TM.pager(
                    arrow == 2 // «
                      ? (startRow = 1)
                      : arrow == 3 // ‹
                      ? (startRow = startRow - $pagesize)
                      : arrow == 4
                      ? (startRow = startRow + $pagesize) // ›
                      : //: (startRow = totalrows - $pagesize + 1) // » TODO page to first on last page/ don't count back
                        (startRow = totalrows - (totalrows % $pagesize) + 1)
                  ))
              ) => BTAG; // RETURN B
              // ---------------------------------------- built #pager
              let PAGERTD = TAG("td");
              let TFOOTTR = TAG("tr");
              let PAGERSTYLE = TAG("style");
              let PAGESIZESPAN = TAG("span");
              let PAGESIZESELECT = TAG(
                "select",
                $pagesizes.map(
                  (x) =>
                    `<option style=display:inline-block value=${x}>${x}</option>`
                ).join``
              );
              PAGESIZESELECT.onchange = () =>
                TM.pager(startRow, Number(PAGESIZESELECT.value));
              PAGERTD.id = "pager"; // for clearer CSS
              PAGERTD.setAttribute("colspan", "100%");
              TFOOTTR.append(PAGERTD);
              PAGERTD.append(
                PAGESIZESPAN,
                pageTAG(2),
                pageTAG(3),
                PAGESIZESELECT,
                pageTAG(4),
                pageTAG(5),
                PAGERSTYLE
              );
              TM.thead.append(TR);
              TM.tfoot.append(TFOOTTR);
              TM.table.append(TM.thead, TM.tbody, TM.tfoot);
              TM.table.setAttribute("role", "table");
              TM.table.style.tableLayout = "fixed"; // TODO move, do only once? or toggle some value?

              //doc ---------------------------------------- #pager Function
              TM.pager = (first = startRow, size = $pagesize) => {
                // process TM.grouped values keep all rows with grouped values
                TM.selected = TM.TRs.filter(
                  // filter all TRs
                  (TR) =>
                    Object.keys(TM.grouped) // get filtered columnnames
                      .map((colname) => TR.row[colname] == TM.grouped[colname]) // T/F
                      .every((x) => x) // all True
                );
                let groupedRowCount = Object.keys(TM.grouped).length
                  ? TM.selected.length
                  : 0;
                if (typeof first == "string" && first.includes("groupby")) {
                  first = 1;
                  if (!TM.selected.length) console.error("no TR", TM.grouped); // TODO no selection warning
                }
                //doc ---------------------------------------- set pager pagesize
                first = startRow = Number(first);
                size = Number(size);
                if (first < 1) first = 1;
                PAGESIZESELECT.value = $pagesize = size;
                if (groupedRowCount - $pagesize < $pagesizeMargin) {
                  // display all selected rows
                  $pagesize = groupedRowCount || $pagesize;
                  PAGERSTYLE.innerHTML =
                    "#pager b,#pager #pages{visibility:hidden}";
                } else {
                  // display paged selected rows
                  if (first > totalrows) first = totalrows - $pagesize;
                  //doc ---------------------------------------- show/hide pager <b>uttons
                  PAGERSTYLE.innerHTML = `${
                    first + $pagesize < totalrows
                      ? first == 1
                        ? "#pager b:nth-of-type(1),#pager b:nth-of-type(2){visibility:hidden}"
                        : ""
                      : "#pager b:nth-of-type(3),#pager b:nth-of-type(4){visibility:hidden}"
                  }`;
                  // ---------------------------------------- update TR
                }
                //doc --------------------------------------- sort by columns
                let sortColumns = TM.THs.filter((TH) => TH.sorted);
                let getRowValue = (TH, TRxy) =>
                  sortColumns.map((TH) =>
                    TH.isNumber
                      ? String(TRxy.row[TH.colname]).padStart(10, "0") // pad numbers to correct sort String
                      : TRxy.row[TH.colname]
                  ).join``;
                sortColumns.map((TH) =>
                  TM.selected.sort(
                    (
                      x, // first item for sort
                      y // second item for sort
                    ) =>
                      TH.isNumber
                        ? // sort by Number value
                          Number(getRowValue(TH, TH.sorted == 2 ? y : x)) -
                          Number(getRowValue(TH, TH.sorted == 2 ? x : y))
                        : // sort by String value
                          getRowValue(TH, TH.sorted == 2 ? y : x).localeCompare(
                            getRowValue(TH, TH.sorted == 2 ? x : y)
                            //optional Locale "en" // TODO give user a hook
                          )
                  )
                );

                TM.THs.map((TH) =>
                  TH.sorted
                    ? TH.header.setAttribute("data-sort", "▲▼"[TH.sorted - 1]) //todo User configurable
                    : TH.header.removeAttribute("data-sort")
                );
                //! --------------------------------------- trim TM.selected to pagesize
                TM.selected = TM.selected.slice(
                  startRow - 1,
                  startRow + $pagesize - 1
                );
                console.do(
                  "pager",
                  "ps:",
                  $pagesize,
                  "sR",
                  startRow,
                  first,
                  "grc",
                  groupedRowCount
                );
                //! --------------------------------------- replace all TRs
                TM.tbody.replaceChildren(...TM.selected);
                //! --------------------------------------- set pager data
                PAGESIZESPAN.innerHTML =
                  `<span id=pages><button>1</button> [prevpages] ${first} ⎯ ${
                    first + TM.selected.length - 1
                  } [nextpages] /</span> ${totalrows} ` +
                  (groupedRowCount ? ` ⭃ ` + groupedRowCount : ``);

                //! --------------------------------------- update all TH, resize <select> to show all inclusions
                let highest = TM.THs.reduce((highest, TH) => {
                  TH.update(true); // update to new <optgroup> state
                  let count =
                    TH.querySelector("optgroup")?.children.length || 1;
                  //console.do(TH.id, count);
                  if (highest > count) return highest;
                  return count;
                }, 1); // update in/out selection for all TH
                TM.groupby.map(
                  (SELECT) =>
                    (SELECT.size = TM.grouped.size //if any active groupby
                      ? highest < 11
                        ? highest + 4 // then show groupby INselection items
                        : 11 // to a max of 11
                      : 1) // else show 1 row select
                );
                this.savestate();
              }; // TM.pager() function
              // end #pager ---------------------------------------- built #pager
            } // end else (rownr==0) TH creator

            return TM; // return reduceRight accumulator. TM is a complex Object!
          }, // .reduceRight
          {
            //! Object passed as .reduceRight Accumulator
            columns: new Map(), // columns defined as (unknown) Elements in HTML Template
            groupby: [],
            grouped: {},
            TRs: [], // all read JSON rows converted to TR
            selected: [],
            //TODO TR: (x)=> find row by x
            THs: [],
            // Find a TH columns - 3 ways to get TH : TH,number,columname
            TH: (x) =>
              typeof x == "object"
                ? x // x is TH
                : typeof x == "number"
                ? this.$table.THs[x] // x is number
                : this.$table.THs.filter((TH) => TH.colname == x)[0], // x is string,
            table: document.createElement("table"),
            thead: document.createElement("thead"),
            tbody: document.createElement("tbody"),
            tfoot: document.createElement("tfoot"),
          }
        );
        console.timers.push("built TABLE");
        window.TM = this.$table;
        this.shadowRoot.append(this.$table.table);
        //init sort. TM.sorted.sorted MUST be an existing TH
        //RFthis.$table.sorted = this.$table.TH(0); // current sorted TH
        //RFthis.sort();
        //init page
        //this.$table.TH("department")?.groupby("pasta");
        //this.$table.TH("Category")?.groupby("Anti-Malware");
        //this.$table.TH("Category")?.groupby("*");
        //this.$table.pager(this.getAttribute("rownr") || 1);
        this.$table.TH("naam")?.sort();

        //! Sort AH shopping list
        this.$table.TH("Order")?.sort();
        this.$table.TH("Buy")?.groupby("TRUE");

        //sort:["colname"]
        this.loadstate();
        this.$table.pager(1, 30);
        console.timers.push("first TABLE page*");
      } // if(json.length)
    } //load(json)

    savestate() {
      console.do("Save state");
      localStorage.setItem(
        btoa(this.for),
        JSON.stringify({
          sorted: this.$table.THs.map((TH) => [TH.colname, TH.sorted]),
          grouped: this.$table.grouped,
        })
      );
      //! don't ! callstack error      this.loadstate();
    }
    loadstate(saved = JSON.parse(localStorage.getItem(btoa(this.for)))) {
      if (saved) {
        Object.keys(saved.grouped).map((colname) =>
          this.$table.TH(colname).groupby(saved.grouped[colname])
        );
        console.log(this.$table);
        saved.sorted.map(([colname, sorted]) => {
          if (this.$table.TH(colname)?.sorted)
            this.$table.TH(colname).sorted = sorted;
        });
      }
    }
    sort(
      input = this.getAttribute("sort"),
      TH = this.$table.TH(input) // get TH 3 ways:: columnNr, string or TH
    ) {
      console.error("SORT");
      TH && TH.sort(); //
    } // sort()
  } //define
); // customElements.define

// using <file-size> Web Component for Dev.to post
//import {} from "https://file-size.github.io/element.js";
