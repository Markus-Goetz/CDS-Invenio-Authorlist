## This file is part of Invenio.
## Copyright (C) 2005, 2006, 2007, 2008, 2009, 2010, 2011 CERN.
##
## Invenio is free software; you can redistribute it and/or
## modify it under the terms of the GNU General Public License as
## published by the Free Software Foundation; either version 2 of the
## License, or (at your option) any later version.
##
## Invenio is distributed in the hope that it will be useful, but
## WITHOUT ANY WARRANTY; without even the implied warranty of
## MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
## General Public License for more details.
##
## You should have received a copy of the GNU General Public License
## along with Invenio; if not, write to the Free Software Foundation, Inc.,
## 59 Temple Place, Suite 330, Boston, MA 02111-1307, USA.

# pylint: disable=C0103

"""BibEdit Templates."""

__revision__ = "$Id$"

from invenio.config import CFG_SITE_URL

import invenio.authorlist_config as cfg

class Template:

    """Authorlist Template Class."""

    def __init__(self):
        """Initialize."""
        pass
        
    def metaheader(self):
        return """
               %s
               %s
               <script type="text/javascript">
                   jQuery( document).ready( function() {
                       var authorlist = new Authorlist( 'authorlist' );
                   });
               </script>
               """ %  (self.style(), self.scripts())
        
    def style(self):
        return '<style type="text/css" title="SmoothnessTheme">\n%s</style>' % \
               '\n'.join([self.css(sheet) for sheet in cfg.Resources.STYLESHEETS])
        
    def css(self, css):
        return '@import "%s/img/%s";' % (CFG_SITE_URL, css)
        
    def scripts(self):
        return '\n'.join([self.javascript(script) for script in cfg.Resources.SCRIPTS])
        
    def javascript(self, js):
        return '<script type="text/javascript" src="%s/js/%s"></script>' % (CFG_SITE_URL, js)
        
    def body(self):
        return '<div id="authorlist"></div>'
