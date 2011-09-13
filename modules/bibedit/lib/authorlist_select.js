( function( jQuery ) {
    AuthorlistSelectCSS = {
        'Select'        : 'AuthorlistSelect',
        'Text'          : 'AuthorlistText',
        'Icon'          : 'AuthorlistIcon ui-icon ui-icon-triangle-1-s'
    }

    jQuery.fn.extend( {
        authorlist_select : function( oSettings ) {
            return this.each( function() {            
                var nText = jQuery( '<span>' );
                nText.addClass( AuthorlistSelectCSS.Text );
                
                var nIcon = jQuery( '<span>' );
                nIcon.addClass( AuthorlistSelectCSS.Icon );
                
                var nSelect = jQuery( '<select>' );
                nSelect.addClass( AuthorlistSelectCSS.Select );
                nSelect.css( 'opacity', 0 );
                
                var aOptions = oSettings.options;
                for ( var i = 0, iLen = aOptions.length; i < iLen; i++ ) {
                    var sOption = aOptions[i];
                    var sSelected = sOption == oSettings.value ? ' selected' : '';
                    var nOption = jQuery( '<option' + sSelected + '>' );
                    
                    nOption.text( sOption );
                    if ( sOption == oSettings.value ) {
                        nText.text( sOption );
                    }
                    nSelect.append( nOption );
                }
                
                var self = jQuery( this );
                self.append( nText, nIcon, nSelect );
            } );
        }
    } );
    
    jQuery( 'select.' + AuthorlistSelectCSS.Select ).live( 'change', function( event ) {
        var nSelect = jQuery( event.target );
        var nText = nSelect.siblings( 'span.' + AuthorlistSelectCSS.Text );
        
        nText.text( jQuery( ':selected', nSelect ).val() );
    } );
} )( jQuery );
