import re

EMPTY                  = re.compile('^\s*$')
UNDEFINED              = 'UNDEFINED'

class Resources:
    SCRIPTS            = ['jquery.min.js',
                          'authorlist.jquery-ui-1.8.6.min.js',
                          'jquery.dataTables.min.js',
                          'jquery.dataTables.ColVis.min.js',
                          'authorlist.js',
                          'authorlist.spreadSheet.js',
                          'authorlist.select.js']
                   
    STYLESHEETS         = ['authorlist.css',
                           'authorlist.dataTable.css',
                           'authorlist.dataTable.jquery-ui.css',
                           'authorlist.jquery-ui.custom.css',
                           'authorlist.colVis.css',
                           'authorlist.spreadSheet.css']

class JSON:
    AFFILIATIONS_KEY    = 'affiliations'
    AUTHORS_KEY         = 'authors'
    COLLABORATION       = 'collaboration'
    EXPERIMENT_NUMBER   = 'experiment_number'
    PAPER_ID            = 'paper_id'
    LAST_MODIFIED       = 'last_modified'
    PAPER_TITLE         = 'paper_title'
    REFERENCE_IDS       = 'reference_ids'

    # Author table indices
    INDEX               = 0
    EDIT                = 1
    FAMILY_NAME         = 2
    GIVEN_NAME          = 3
    PAPER_NAME          = 4
    ALIVE               = 5
    AFFILIATIONS        = 6
    INSPIRE_ID          = 7
    
    # Affiliation indices in author table
    AFFILIATION_ACRONYM = 0
    AFFILIATION_STATUS  = 1
    
    # Affiliation table indices
    ACRONYM             = 2
    UMBRELLA            = 3
    NAME                = 4
    DOMAIN              = 5
    MEMBER              = 6
    SPIRES_ID           = 7
    
class AuthorsXML:
    COLLABORATION_ID    = 'c1'
    DECEASED            = 'Deceased'
    INSPIRE             = 'INSPIRE'
    MEMBER              = 'member'
    NONMEMBER           = 'nonmember'
    ORGANIZATION_ID     = 'o'
    SPIRES              = 'SPIRES'
    TIME_FORMAT         = '%Y-%m-%d_%H:%M'
