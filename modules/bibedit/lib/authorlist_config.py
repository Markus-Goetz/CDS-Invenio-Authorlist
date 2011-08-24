UNDEFINED = 'UNDEFINED'

class Resources:
    STYLESHEETS = ['authorlist.css', 
                   'authorlist.dataTable.css',
                   'authorlist.dataTable.jquery-ui.css',
                   'jquery-ui/themes/smoothness/jquery-ui.css',
                   'authorlist.colVis.css',
                   'authorlist.spreadSheet.css']

    SCRIPTS = ['jquery.min.js',
               'jquery-ui-1.7.3.custom.min.js',
               'jquery.dataTables.min.js',
               'jquery.dataTables.ColVis.min.js',
               'authorlist.keyTable.js',
               'authorlist.spreadSheet.js',
               'authorlist.js']

class JSON:
    FALSE = 'false'
    TRUE = 'true'

    # top-level fields
    COLLABORATION = 'Collaboration'
    PAPER_TITLE = 'PaperTitle'
    REFERENCE = 'ReferenceId'
    AUTHORS = 'Authors'
    AFFILIATIONS = 'Affiliations'
    
    # specific fields for authors
    FAMILY_NAME = 'Family name'
    GIVEN_NAME = 'Given name'
    SUFFIX = 'Suffix'
    NAME_ON_PAPER = 'Name on paper'
    ALIVE = 'Alive'
    AFFILIATED_WITH = 'Affiliated with'
    ALSO_AT = 'Also at'
    INSPIRE_ID = 'Inspire ID'
    
    # specific fields for affiliations
    SHORT_NAME = 'Short name'
    NAME_AND_ADDRESS = 'Name and Address'
    DOMAIN = 'Domain'
    MEMBER = 'Member'
    SPIRES_ID = 'Spires ID'
    
class AuthorsXML:
    DATE_TIME_FORMAT = '%Y-%m-%d_%H:%M'
    COLLABORATION_ID = 'c1'
    
    ORGANIZATION_SOURCE = 'INSPIRE'
    DOMAIN = ''
    MEMBER = 'member'
    NONMEMBER = 'nonmember'
    
    GIVEN_NAME = ''
    SUFFIX = ''
    ALIVE = ''
    DECEASED = 'Deceased'
    AFFILIATED_WITH = 'Affiliated with'
    ALSO_AT = 'Also at'
