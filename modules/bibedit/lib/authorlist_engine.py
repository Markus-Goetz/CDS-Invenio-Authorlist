## This file is part of Invenio.
## Copyright (C) 2009, 2010, 2011 CERN.
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

""" Invenio Authorlist Data Conversion Engine. """

import simplejson as json
import xml.dom.minidom as xml

import invenio.authorlist_config as cfg

class Converter(object):
    CONTENT_TYPE = 'text/plain'
    FILE_NAME = 'converted.txt'

    def __init__(self):
        raise NotImplementedError
        
    def dump(self, data):
        raise NotImplementedError
        
    def dumps(self, data):
        raise NotImplementedError
        
class Converters:
    __converters__ = {}
    
    @classmethod
    def get(cls, mode):
        return cls.__converters__.get(mode.upper(), None)
      
def dump(data, converter):
    return converter().dump(data)
    
def dumps(data, converter):
    return converter().dumps(data)
