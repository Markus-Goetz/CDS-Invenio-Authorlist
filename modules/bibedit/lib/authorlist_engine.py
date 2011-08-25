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
import time
import cStringIO

import invenio.authorlist_config as cfg

class ValueIndexedDict(object):
    def __init__(self, raw_data):
        self.__raw_data = raw_data
        
        self.__indices = {}
        
    def index(self, key):
        if key in self.__indices:
            return
            
        else:
            index = {}
            for element in self.__raw_data:
                index.setdefault(element[key], []).append(element)
                
            self.__indices[key] = index
                
    def select(self, key, where, equals_to):
        if not where in self.__indices:
            self.index(where)
            
        entries = self.__indices.get(where, {}).get(equals_to, [])
        if key == '*':
            return entries
        else:
            return [entry[key] for entry in entries if key in entry]

class Converter(object):
    CONTENT_TYPE = 'text/plain'
    FILE_NAME = 'converted.txt'

    def __init__(self):
        raise NotImplementedError
        
    def dump(self, data):
        raise NotImplementedError
        
    def dumps(self, data):
        raise NotImplementedError
        
class JSONConverter(Converter):
    CONTENT_TYPE = 'application/json'
    FILE_NAME = 'authors.json'

    def __init__(self):
        self.data = None
        
    def dump(self, data):
        return data
        
    def dumps(self, data):
        return json.dumps(data, indent=4)

class AuthorsXMLConverter(Converter):
    CONTENT_TYPE = 'application/xml'
    FILE_NAME = 'authors.xml'

    def __init__(self):
        self.document = None
        self.root = None
        self.organizations = None
        
    def dump(self, data, complete=False):
        self.organizations = {}
    
        self.__create_document__(data, complete)
        self.__create_header__(data, complete)
        self.__create_collaborations__(data, complete)
        self.__create_organizations__(data, complete)
        self.__create_authors__(data, complete)
        
        return self.document
        
    def dumps(self, data, complete=False):
        return self.dump(data, complete).toprettyxml(indent = '    ', encoding='utf-8')
        
    def __create_document__(self, data, complete):
        self.document = xml.getDOMImplementation()\
                           .createDocument(None, 'collaborationauthorlist', None)
                           
        self.root = self.document.documentElement
        self.root.setAttribute('xmlns:foaf', 'http://xmlns.com/foaf/0.1/')
        self.root.setAttribute('xmlns:cal', 'http://www.slac.stanford.edu/\
                                             spires/hepnames/authors_xml/')
        
    def __create_header__(self, data, complete):
        creation_date = self.document.createElement('cal:creationDate')
        creation_date_value = time.strftime(cfg.AuthorsXML.DATE_TIME_FORMAT)
        creation_date_text = self.document.createTextNode(creation_date_value)
        creation_date.appendChild(creation_date_text)
        self.root.appendChild(creation_date)
        
        reference_value = data.get(cfg.JSON.REFERENCE, '')
        reference = self.document.createElement('cal:publicationReference')
        reference_text = self.document.createTextNode(reference_value)
        reference.appendChild(reference_text)
        self.root.appendChild(reference)
        
    def __create_collaborations__(self, data, complete):
        collaborations = self.document.createElement('cal:collaborations')
        self.root.appendChild(collaborations)
        
        collaboration = self.document.createElement('cal:collaboration')
        collaboration.setAttribute('id', cfg.AuthorsXML.COLLABORATION_ID)
        collaborations.appendChild(collaboration)
        
        name = self.document.createElement('foaf:name')
        name_value = data.get(cfg.JSON.COLLABORATION, cfg.UNDEFINED)
        name_text = self.document.createTextNode(name_value)
        name.appendChild(name_text)       
        collaboration.appendChild(name)        
        
        if complete:
            experiment = self.document.createElement('cal:experimentNumber')
            collaboration.appendChild(experiment)
            
    def __create_organizations__(self, data, complete):
        organizations = self.document.createElement('cal:organizations')
        
        for index, organization in enumerate(data.get(cfg.JSON.AFFILIATIONS, [])):
            organizations.appendChild(self.__create_organization__(organization, \
                                                                 index, \
                                                                 complete))
        
        self.root.appendChild(organizations) 
        
    def __create_organization__(self, data, index, complete):
        organization = self.document.createElement('foaf:Organization')
        organization_id = 'a' + str(index + 1)
        organization.setAttribute('id', organization_id)
        
        self.organizations[data.get(cfg.JSON.SHORT_NAME)] = organization_id
        
        domain = self.document.createElement('cal:orgDomain')
        domain_value = data.get(cfg.JSON.DOMAIN, cfg.AuthorsXML.DOMAIN)
        domain_text = self.document.createTextNode(domain_value)
        domain.appendChild(domain_text)
        organization.appendChild(domain)
        
        name = self.document.createElement('foaf:name')
        name_value = data.get(cfg.JSON.NAME_AND_ADDRESS, cfg.UNDEFINED)
        name_text = self.document.createTextNode(name_value)
        name.appendChild(name_text)
        organization.appendChild(name)
        
        org_name = self.document.createElement('cal:orgName')
        org_name.setAttribute('source', cfg.AuthorsXML.ORGANIZATION_SOURCE)
        org_name_value = data.get(cfg.JSON.SPIRES_ID, cfg.UNDEFINED)
        org_name_text = self.document.createTextNode(org_name_value)
        org_name.appendChild(org_name_text)
        organization.appendChild(org_name)
        
        status = self.document.createElement('cal:orgStatus')
        status.setAttribute('collaborationid', cfg.AuthorsXML.COLLABORATION_ID)
        if data.get(cfg.JSON.MEMBER) == cfg.JSON.FALSE:
            status_value = cfg.AuthorsXML.NONMEMBER
        else:
            status_value = cfg.AuthorsXML.MEMBER
        status_text = self.document.createTextNode(status_value)
        status.appendChild(status_text)
        organization.appendChild(status)
        
        if complete:
            domain = self.document.createElement('cal:orgDomain')
            organization.appendChild(domain)
            
            org_address = self.document.createElement('cal:orgAddress')
            organzation.appendChild(org_address)
            
            group = self.document.createElement('cal:group')
            organization.appendChild(group)
            
        return organization
            
    def __create_authors__(self, data, complete):
        authors = self.document.createElement('cal:authors')
        
        for index, author in enumerate(data.get(cfg.JSON.AUTHORS, [])):
            authors.appendChild(self.__create_author__(author, index, complete))
        
        self.root.appendChild(authors)
        
    def __create_author__(self, data, index, complete):
        author = self.document.createElement('foaf:Person')
        
        given_name = self.document.createElement('foaf:givenName')
        given_name_value = data.get(cfg.JSON.GIVEN_NAME, \
                                    cfg.AuthorsXML.GIVEN_NAME)
        given_name_text = self.document.createTextNode(given_name_value)
        given_name.appendChild(given_name_text)
        author.appendChild(given_name)
        
        family_name = self.document.createElement('foaf:familyName')
        family_name_value = data.get(cfg.JSON.FAMILY_NAME, cfg.UNDEFINED)
        family_name_text = self.document.createTextNode(family_name_value)
        family_name.appendChild(family_name_text)
        author.appendChild(family_name)
        
        suffix = self.document.createElement('cal:authorSuffix')
        suffix_value = data.get(cfg.JSON.SUFFIX, cfg.AuthorsXML.SUFFIX)
        suffix_text = self.document.createTextNode(suffix_value)
        suffix.appendChild(suffix_text)
        author.appendChild(suffix)
        
        status = self.document.createElement('cal:authorStatus')
        if data.get(cfg.JSON.ALIVE) == cfg.JSON.FALSE:
            status_value = cfg.AuthorsXML.DECEASED
        else:
            status_value = cfg.AuthorsXML.ALIVE
        status_text = self.document.createTextNode(status_value)
        status.appendChild(status_text)
        author.appendChild(status)
        
        name_on_paper = self.document.createElement('cal:authorNamePaper')
        name_on_paper_value = data.get(cfg.JSON.NAME_ON_PAPER, cfg.UNDEFINED)
        name_on_paper_text = self.document.createTextNode(name_on_paper_value)
        name_on_paper.appendChild(name_on_paper_text)
        author.appendChild(name_on_paper)
        
        collaboration = self.document.createElement('cal:authorCollaboration')
        collaboration_value = cfg.AuthorsXML.COLLABORATION_ID
        collaboration.setAttribute('collaborationid', collaboration_value)
        author.appendChild(collaboration)
        
        affiliations = self.document.createElement('cal:authorAffiliations')
        
        affiliated = self.organizations.get(data.get(cfg.JSON.AFFILIATED_WITH))
        if affiliated is not None:
            affiliation = self.__create_affiliation__(affiliated, cfg.AuthorsXML.AFFILIATED_WITH)
            affiliations.appendChild(affiliation)
            
        also_at = self.organizations.get(data.get(cfg.JSON.ALSO_AT))
        if also_at is not None:
            affiliation = self.__create_affiliation__(also_at, cfg.AuthorsXML.ALSO_AT)
            affiliations.appendChild(affiliation)
        
        author.appendChild(affiliations)
        
        if complete:
            name = self.document.createElement('foaf:name')
            author.appendChild(name)
            
            native_name = self.document.createElement('cal:authorNameNative')
            author.appendChild(native_name)
        
            given_name = self.document.createElement('cal:authorNamePaperGiven')
            author.appendChild(given_name)
            
            family_name = self.document.createElement('cal:authorNamePaperFamily')
            author.appendChild(family_name)
            
            collaboration.setAttribute('position', '')
            
            funding = self.document.createElement('cal:authorFunding')
            author.appendChild(funding)
            
        return author
            
    def __create_affiliation__(self, organization, connection):
        affiliation = self.document.createElement('cal:authorAffiliation')
        affiliation.setAttribute('organizationid', organization)
        affiliation.setAttribute('connection', connection)
        
        return affiliation 
        
class AtlasTexConverter(Converter):
    def __init__(self):
        pass
        
class CMSTexConverter(Converter):
    CONTENT_TYPE = 'text/plain'
    FILE_NAME = 'authors.tex'
    
    __ORG_TEMPLATE__ = '\\textbf{%s}\\\\*[0pt]\n%s\n\\vskip\\cmsintskip\n'
    __ALSO_AT_TEMPLATE__ = '%s:~~Also at %s\\\\'

    def __init__(self):
        self.authors = None
        self.affiliations = None
        
    def dump(self, data):
        self.__index_data__(data)
        result = cStringIO.StringIO()
        deceased = False
        
        for affiliation in data.get(cfg.JSON.AFFILIATIONS, []):
            entries = self.authors.select('*', where=cfg.JSON.AFFILIATED_WITH, 
                                          equals_to=affiliation.get(cfg.JSON.SHORT_NAME))
                                  
            if entries:
                affiliation_name = affiliation.get(cfg.JSON.NAME_AND_ADDRESS)
                authors = [entry.replace(' ', '~', 1) for entry in entries]
                out = self.__class__.__ORG_TEMPLATE__ % (affiliation_name, ', '.join(entries))
                result.write(out)
        
        if deceased:        
            result.write('\\dag:~Deceased\\\\\n')
                
        return result
        
    def dumps(self, data):
        return self.dump(data).getvalue()
        
    def __index_data__(self, data):
        self.authors = ValueIndexedDict(data.get(cfg.JSON.AUTHORS, []))
        self.authors.index(cfg.JSON.AFFILIATED_WITH)
        self.authors.index(cfg.JSON.ALSO_AT)
        
        self.affiliations = ValueIndexedDict(data.get(cfg.JSON.AFFILIATIONS, []))
        self.affiliations.index(cfg.JSON.SHORT_NAME)
        
    def __create_author__(self, author_data):
        author_name = author_data.get(cfg.JSON.NAME_ON_PAPER)
        deceased = False
        
        if author_data.get(cfg.JSON.ALIVE) == cfg.JSON.FALSE:
            dead = '$^{\\textrm{\\dag}}$'
            deceased = True
        else:
            dead = ''
            
        
        
        return '%s%s%s' % (author_name, dead, also_at), deceased
        
class MARCXMLConverter(Converter):
    def __init__(self):
        pass
        
class Converters:
    __converters__ = {
        'JSON' : JSONConverter,
        'AUTHORSXML' : AuthorsXMLConverter,
        'CMS TEX' : CMSTexConverter
    }
    
    @classmethod
    def get(cls, mode):
        return cls.__converters__.get(mode.upper(), None)
      
def dump(data, converter):
    return converter().dump(data)
    
def dumps(data, converter):
    return converter().dumps(data)
