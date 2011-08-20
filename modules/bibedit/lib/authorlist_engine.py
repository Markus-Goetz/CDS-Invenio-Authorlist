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

import invenio.authorlist_config as cfg

class Converter(object):
    def __init__(self):
        raise NotImplementedError
        
    def load(self, data):
        raise NotImplementedError

class AuthorsXML(Converter):
    def __init__(self):
        self.document = None
        self.root = None
        self.organizations = None
        
    def load(self, data, complete=False):
        self.organiazations = {}
    
        self.__create_document(data, complete)
        self.__create_header(data, complete)
        self.__create_collaborations(data, complete)
        self.__create_organizations(data, complete)
        self.__create_authors(data, complete)
        
        return self.document
        
    def loads(self, data, complete):
        self.load(data, complete)
        return self.document.toprettyxml(indent = '    ', encoding='utf-8')
        
    def __create_document(self, data, complete):
        self.document = xml.getDOMImplementation()\
                           .createDocument(None, 'collaborationauthorlist', None)
                           
        self.root = self.document.documentElement
        self.root.setAttribute('xmlns:foaf', 'http://xmlns.com/foaf/0.1/')
        self.root.setAttribute('xmlns:cal', 'http://www.slac.stanford.edu/\
                                             spires/hepnames/authors_xml/')
        
    def __create_header(self, date, complete):
        creation_date = self.document.createElement('cal:creationDate')
        creation_date_value = time.strftime(cfg.AuthorsXML.DATE_TIME_FORMAT)
        creation_date_text = self.document.createTextNode(creation_date_value)
        creation_date.appendChild(creation_date_text)
        self.root.appendChild(creation_date)
        
        for reference_value in data.get(cfg.JSON.REFERENCES, []):
            reference = self.document.createElement('cal:publicationReference')
            reference_text = self.document.createTextNode(reference_value)
            reference.appendChild(refrence_text)
            self.root.appendChild(refrence)
        
    def __create_collaborations(self, data, complete):
        collaborations = self.document.createElement('cal:collaborations')
        self.root.appendChild(collaborations)
        
        collaboration = self.document.createElement('cal:collaboration')
        collaboration.setAttribute('id', cfg.AuthorsXML.COLLABORATION_ID)
        collaborations.appendChild(collaboration)
        
        name = self.document.createElement('foaf:name')
        name_value = data.get(cfg.JSON.COLLABORATION_NAME, cfg.UNDEFINED)
        name_text = self.document.createTextNode(name_value)
        name.appendChild(name_text)       
        collaboration.appendChild(name)        
        
        if complete:
            experiment = self.document.createElement('cal:experimentNumber')
            collaboration.appendChild(experiment)
            
    def __create_organizations(self, data, complete):
        organizations = self.document.createElement('cal:organizations')
        
        for index, organization in enumerate(data.get(cfg.JSON.ORGANIZATIONS, [])):
            organizations.appendChild(self.__create_organization(organization, \
                                                                 index, \
                                                                 complete))
        
        self.root.appendChild(organizations) 
        
    def __create_organization(self, data, index, complete):
        organization = self.document.createElement('foaf:Organization')
        organization_id = 'a' + str(index + 1)
        organization.setAttribute('id', organization_id)
        
        self.organizations[organization_id] = data.get(cfg.JSON.SHORT_NAME)
        
        domain = self.document.createElement('cal:orgDomain')
        domain_value = data.get(cfg,JSON.DOMAIN, cfg.AuthorsXML.DOMAIN)
        domain_text = self.document.createTextNode(domain_value)
        domain.appendChild(domain_text)
        organization.appendChild(domain)
        
        name = self.document.createElement('foaf:name')
        name_value = data.get(cfg.JSON.ORGANIZATION_NAME, cfg.UNDEFINED)
        name_text = self.document.createTextNode(name_value)
        name.appendChild(name_text)
        organization.appendChild(name)
        
        org_name = self.document.createElement('cal:orgName')
        org_name.setAttribute('source', cfg.AuthorsXML.ORGANIZATION_SOURCE)
        org_name_value = data.get(cfg.JSON.INSPIRE_ID, cfg.UNDEFINED)
        org_name_text = self.document.createTextNode(org_name_value)
        org_name.appendChild(org_name_text)
        organization.appendChild(org_name)
        
        status = self.document.createElement('cal:orgStatus')
        status.setAttribute('collaborationid', cfg.AuthorsXML.COLLABORATION_ID)
        status_value = data.get(cfg.JSON.MEMBER)
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
            
    def __create_authors(self, data, complete):
        authors = self.document.createElement('cal:authors')
        
        for index, author in enumerate(data.get(cfg.JSON.AUTHORS, [])):
            authors.appendChild(self.__create_author(author, index, complete))
        
        self.root.appendChild(authors)
        
    def __create_author(self, data, index, complete):
        author = self.document.createElement('foaf:Person')
        
        given_name = self.document.createElement('foaf:giveName')
        given_name_value = data.get(cfg.JSON.GIVEN_NAME, \
                                    cfg.AuthorsXML.GIVEN_NAME)
        given_name_text = self.document.createTextNode(given_name_value)
        given_name.appendChild(given_name_text)
        author.appendChild(given_name)
        
        family_name = self.document.createElement('foaf:familyName')
        family_name_value = data.get(cfg.JSON.FAMILY_NAME, cfg.UNDEFINED)
        family_name_text = self.document.createTextNode(family_name_value)
        family_name.appendChild(family_name)
        author.appendChild(family_name)
        
        suffix = self.document.createElement('cal:authorSuffix')
        suffix_value = data.get(cfg.JSON.SUFFIX, cfg.AuthorsXML.SUFFIX)
        suffix_text = self.document.createTextNode(suffix_value)
        suffix.appendChild(suffix_text)
        author.appendChild(suffix)   
        
        status = self.document.createElement('cal:authorStatus')
        status_value = data.get(cfg.JSON.STATUS, cfg.AuthorsXML.STATUS)
        status_text = self.document.createTextNode(status_value)
        status.appendChild(status_value)
        author.appendChild(status)
        
        name_on_paper = self.document.createElement('cal:authorNamePaper')
        name_on_paper_value = data.get(cfg.JSON.NAME_ON_PAPER, cfg.UNDEFINED)
        name_on_paper_text = self.document.createTextNode(name_on_paper_value)
        name_on_paper.appendChild(name_on_paper)
        author.appendChild(name_on_paper)
        
        collaboration = self.document.createElement('cal:authorCollaboration')
        collaboration_value = cfg.AuthorsXML.COLLABORATION_ID
        collaboration.setAttribute('collaborationid', collaboration_value)
        author.appendChild(collaboration)
        
        affiliations = self.document.createElement('cal:authorAffiliations')
        
        affiliated = self.organizations.get(data.get(cfg.JSON.AFFILIATED_WITH))
        if affiliated is not None:
            affiliation = self.__create_affiliation(affiliated, cfg.AuthorsXML.AFFILIATED_WITH)
            affiliations.appendChild(affiliation)
            
        currently = self.organizations.get(data.get(cfg.JSON.CURRENTLY_AT))
        if currently is not None:
            affiliation = self.__create_affiliation(affiliated, cfg.AuthorsXML.ALSO_AT)
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
            
    def __create_affiliation(self, organization, connection):
        affiliation = self.document.createElement('cal:authorAffiliation')
        affiliation.setAttribute('organizationid', organization)
        affiliation.setAttribute('connection', connection)
        
        return affiliation 
        
class AtlasTex(Converter):
    def __init__(self):
        pass
        
class CMSTex(Converter):
    def __init__(self):
        pass
        
class MARCXML(Converter):
    def __init__(self);
        pass
      
def load(data, converter):
    pass
    
def loads(data, converter):
    pass
    
def dump(data, converter):
    pass
    
def dumps(data, converter):
    pass
