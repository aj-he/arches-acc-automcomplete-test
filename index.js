const archesHost = ""; // your arches location without trailing slash e.g. https://www.my-arches-instance.com
const searchUrl = `${archesHost}/search/resources`;
const termsUrl = `${archesHost}/search/terms`;

accessibleAutocomplete({
  element: document.querySelector('#my-autocomplete-container'),
  id: 'my-autocomplete', // To match it to the existing <label>.
  source: suggest,
  minLength: 3,
  onConfirm: onConfirm,
  templates: {
    inputValue: templateInputValue,
    suggestion: templateSuggestion
  }
})

function loading(isLoading){
    if (!isLoading) $(".loading-icon").addClass("hidden");
    if (isLoading) $(".loading-icon").removeClass("hidden");

}

function suggest (query, populateResults) {
    loading(true);
    $.ajax({
        url: termsUrl,
        type: "get",
        data: { 
            q: query,
            _: Math.floor(Math.random() * 1000000)
        },
        success: function(response) {
            const concepts = response.concepts;
            const terms = response.terms;
            const q = [{"inverted":false,"type":"string","context":"","context_label":"","id": query,"text": query,"value": query}];
            populateResults(q.concat(terms,concepts))
            loading(false);
        },
        error: function(xhr) {  
        //Do Something to handle error
        loading(false);
        console.log(xhr);
        }
    });

}

function onConfirm(option) {
    console.log("...confirmed option", option)
    if (option == undefined) return '';
    option.inverted = false;
    tags.push(option);
    updateTagList();
    
}

function templateInputValue(option){
    if (option == undefined) return '';
    return option.text;
}
function templateSuggestion(option){
    let ret = `${option.type} - ${option.text}`;
    if(option.context_label != ''){
        ret +=  ` <i>[${option.context_label}]</i>`
    }
    return ret;
}

let tags = [];

function removeTag(id){
    try {
        id = id.toString();
    } catch (error) {
        
    }
    tags = tags.filter(t => t.id != id);
    updateTagList();
}

function updateTagList(){
    ulElement = $('#tags');
    ulElement.empty();
    let tagHtml = '';
    tags.forEach(t => {
        let ret = `${t.type} - ${t.text}`;
        if(t.context_label != ''){
            ret +=  ` <i>[${t.context_label}]</i>`
        }
        tagHtml += `<span class="facet-wrapper" id="${t.id}"><span>${ret}</span><button class="close-button" type="button" aria-label="Remove filter ${t.text}" onclick="removeTag('${t.id}')">✕</button></span>` 
    });
    ulElement.html(tagHtml);
    quickSearchArches();
}

const sres = $('.search-results');
function quickSearchArches(){
    loading(true);
    sres.empty();

    if(tags.length<1) {
		$('#results-count').text("0");
		return;
	}

    $.ajax({
        url: searchUrl,
        type: "get", //send it through get method
        data: { 
            tiles: true,
            format: "tilecsv",
            reportlink: false,
            precision: 6,
            total: 198329,
            "paging-filter": 1,
            "term-filter": JSON.stringify(tags)
        },
        success: function(response) {
            populateSearchResults(response)
            loading(false);
        },
        error: function(xhr) {
          //Do Something to handle error
          console.log(xhr);
          loading(false);
        }
      });
}

function populateSearchResults(res){
    let sources = res.results?.hits?.hits.map(s => s._source);
    let resHtml = '';
    sources.forEach(s => {
        resHtml += `<div class="result-wrapper"><p>Name: ${s.displayname}</p><p>Description: ${s.displaydescription}</p></div>`
    });
    sres.html(resHtml);
    $('#results-count').text(res.total_results.toString());
    $('#my-autocomplete').val(""); // This should probably be in a better place or use a specific component function
}