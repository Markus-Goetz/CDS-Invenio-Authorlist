import invenio.authorlist_config as cfg
from invenio.dbquery import run_sql

def clone(paper_id):
    data = {}
    
    clone_id = clone_paper(paper_id)
    if (clone_id is None):
        # TODO: error message here
        data['id'] = paper_id
        return data
    else:
        data['id'] = clone_id
        
    clone_references(paper_id, clone_id)
    clone_affiliations(paper_id, clone_id)
    clone_authors(paper_id, clone_id)
    
    return data
    
def clone_paper(paper_id):
    clone_id = run_sql("""SELECT id FROM aulPAPERS WHERE id = %s""", (paper_id,))
    if (not clone_id): return None
    
    clone_id = run_sql("""INSERT INTO aulPAPERS 
                          (id, title, collaboration, experiment_number) 
                          SELECT %s, title, collaboration, experiment_number 
                          FROM aulPAPERS WHERE id = %s;""", (None, paper_id,))
                          
    return clone_id
                          
def clone_references(paper_id, clone_id):
    run_sql("""INSERT INTO aulREFERENCES (item, reference, paper_id) 
               SELECT item, reference, %s FROM aulREFERENCES 
               WHERE paper_id = %s;""", (clone_id, paper_id,))
               
def clone_affiliations(paper_id, clone_id):
    run_sql("""INSERT INTO aulAFFILIATIONS (item, acronym, umbrella, 
               name_and_address, domain, member, spires_id, paper_id) 
               SELECT item, acronym, umbrella, name_and_address, 
               domain, member, spires_id, %s FROM aulAFFILIATIONS 
               WHERE paper_id = %s;""", (clone_id, paper_id,))
               
def clone_authors(paper_id, clone_id):
    run_sql("""INSERT INTO aulAUTHORS (item, family_name, given_name, 
               name_on_paper, alive, inspire_id, paper_id) 
               SELECT item, family_name, given_name, name_on_paper, 
               alive, inspire_id, %s FROM aulAUTHORS 
               WHERE paper_id = %s;""", (clone_id, paper_id,))
               
    clone_author_affiliations(paper_id, clone_id)
    
def clone_author_affiliations(paper_id, clone_id):
    run_sql("""INSERT INTO aulAUTHOR_AFFILIATIONS (item, affiliation_acronym, 
               affiliation_status, author_item, paper_id) 
               SELECT item, affiliation_acronym, affiliation_status, 
               author_item, %s FROM aulAUTHOR_AFFILIATIONS 
               WHERE paper_id = %s;""", (clone_id, paper_id,))

def load(paper_id):
    data = {}
    
    load_paper(paper_id, data)
    load_references(paper_id, data)
    load_affiliations(paper_id, data)
    load_authors(paper_id, data)
    
    return data
    
def load_paper(paper_id, data):
    paper = run_sql("""SELECT title, collaboration, experiment_number 
                       FROM aulPAPERS WHERE id = %s;""", (paper_id,))
    
    if (not paper):
        # TODO add message here
    
        data[cfg.JSON.PAPER_TITLE]        = ''
        data[cfg.JSON.COLLABORATION]      = ''
        data[cfg.JSON.EXPERIMENT_NUMBER]  = ''
        
        return data
        
    title, collaboration, experiment_number = paper[ 0 ]
                        
    data[cfg.JSON.PAPER_TITLE]        = title
    data[cfg.JSON.COLLABORATION]      = collaboration
    data[cfg.JSON.EXPERIMENT_NUMBER]  = experiment_number
    
    return data
    
def load_references(paper_id, data):
    references = run_sql("""SELECT reference FROM aulREFERENCES 
                            WHERE paper_id = %s;""", (paper_id,))
    
    reference_ids = [reference[0] for reference in references]
    data[cfg.JSON.REFERENCE_IDS] = reference_ids
    
    return data
    
def load_affiliations(paper_id, data):
    result = run_sql("""SELECT item, acronym, umbrella, name_and_address, domain,
                        member, spires_id FROM aulAFFILIATIONS 
                        WHERE paper_id = %s;""", (paper_id,))
    affiliations = data.setdefault(cfg.JSON.AFFILIATIONS_KEY, [])
    
    for affiliation in result:
        item, acronym, umbrella, name, domain, member, spires_id = affiliation
        affiliations.append([item + 1, '', acronym, umbrella, name, 
                             domain, bool(member), spires_id])
        
    return data

def load_authors(paper_id, data):
    result = run_sql("""SELECT item, family_name, given_name, name_on_paper, 
                        alive, inspire_id FROM aulAUTHORS 
                        WHERE paper_id = %s;""", (paper_id,))
    authors = data.setdefault(cfg.JSON.AUTHORS_KEY, [])
    
    for author in result:
        item, family_name, given_name, paper_name, alive, inspire_id = author
        author_affiliations = load_author_affiliations(paper_id, item)
        authors.append([item + 1, '', family_name, given_name, paper_name, 
                        bool(alive), author_affiliations, inspire_id])
        
    return data
    
def load_author_affiliations(paper_id, author_id):
    result = run_sql("""SELECT affiliation_acronym, affiliation_status 
                        FROM aulAUTHOR_AFFILIATIONS WHERE author_item = %s 
                        AND paper_id = %s;""", (author_id, paper_id,))
    author_affiliations = []
    
    for author_affiliation in result:
        acronym, status = author_affiliation
        author_affiliations.append([acronym, status])
        
    return author_affiliations

def save(paper_id, data):
    new_paper_id = save_paper(paper_id, data)
    if (paper_id is None):
        paper_id = new_paper_id	
        
    save_references(paper_id, data)
    save_affliations(paper_id, data)
    save_authors(paper_id, data)
    
    return paper_id
    
def save_paper(paper_id, data):
    if (not paper_id):
        paper_id = None

    data_tuple = (# insert values
                  paper_id, 
                  data[cfg.JSON.PAPER_TITLE], 
                  data[cfg.JSON.COLLABORATION], 
                  data[cfg.JSON.EXPERIMENT_NUMBER], 
                  
                  # update values
                  data[cfg.JSON.PAPER_TITLE], 
                  data[cfg.JSON.COLLABORATION], 
                  data[cfg.JSON.EXPERIMENT_NUMBER])

    return run_sql("""INSERT INTO 
                      aulPAPERS (id, title, collaboration, experiment_number)
                      VALUES (%s, %s, %s, %s) 
                      ON DUPLICATE KEY UPDATE
                      title = %s,
                      collaboration = %s,
                      experiment_number = %s;""", data_tuple)
                      
def save_references(paper_id, data):
    reference_ids = data[cfg.JSON.REFERENCE_IDS]

    # Insert or update old references
    for index, reference in enumerate(reference_ids):
        data_tuple = (# insert values
                      index,
                      reference,
                      paper_id,
                      
                      # update values
                      reference)
    
        run_sql("""INSERT INTO 
                   aulREFERENCES (item, reference, paper_id)
                   VALUES (%s, %s, %s)
                   ON DUPLICATE KEY UPDATE
                   reference = %s;""", data_tuple)
                   
    # Delete old references that are out of bounds - i.e. have a higher index 
    # than the length of the reference list
    run_sql("""DELETE FROM aulREFERENCES WHERE item >= %s AND paper_id = %s;""", 
            (len(reference_ids), paper_id))

def save_affliations(paper_id, data):
    affiliations = data[cfg.JSON.AFFILIATIONS_KEY]
    
    for index, affiliation in enumerate(affiliations):
        data_tuple = (# insert values
                      index,
                      affiliation[cfg.JSON.ACRONYM],
                      affiliation[cfg.JSON.UMBRELLA],
                      affiliation[cfg.JSON.NAME],
                      affiliation[cfg.JSON.DOMAIN],
                      affiliation[cfg.JSON.MEMBER],
                      affiliation[cfg.JSON.SPIRES_ID],
                      paper_id,
                      
                      # update values
                      affiliation[cfg.JSON.ACRONYM],
                      affiliation[cfg.JSON.UMBRELLA],
                      affiliation[cfg.JSON.NAME],
                      affiliation[cfg.JSON.DOMAIN],
                      affiliation[cfg.JSON.MEMBER],
                      affiliation[cfg.JSON.SPIRES_ID])
    
        run_sql("""INSERT INTO 
                   aulAFFILIATIONS (item, acronym, umbrella, name_and_address, 
                                    domain, member, spires_id, paper_id)
                   VALUES(%s, %s, %s, %s, %s, %s, %s, %s)
                   ON DUPLICATE KEY UPDATE
                   acronym = %s,
                   umbrella = %s,
                   name_and_address = %s,
                   domain = %s,
                   member = %s,
                   spires_id = %s;""", data_tuple)
                   
    # Delete old affiliations that are out of bounds - i.e. have a higher index 
    # than the length of the affiliations list
    run_sql("""DELETE FROM aulAFFILIATIONS WHERE item >= %s AND paper_id = %s;""", 
            (len(affiliations), paper_id))
    
def save_authors(paper_id, data):
    authors = data[cfg.JSON.AUTHORS_KEY]
    
    for index, author in enumerate(authors):
        data_tuple = (# insert values
                      index,
                      author[cfg.JSON.FAMILY_NAME],
                      author[cfg.JSON.GIVEN_NAME],
                      author[cfg.JSON.PAPER_NAME],
                      author[cfg.JSON.ALIVE],
                      author[cfg.JSON.INSPIRE_ID],
                      paper_id,
                      
                      # update values
                      author[cfg.JSON.FAMILY_NAME],
                      author[cfg.JSON.GIVEN_NAME],
                      author[cfg.JSON.PAPER_NAME],
                      author[cfg.JSON.ALIVE],
                      author[cfg.JSON.INSPIRE_ID])
                      
        run_sql("""INSERT INTO 
                   aulAUTHORS (item, family_name, given_name, name_on_paper, 
                               alive, inspire_id, paper_id) 
                   VALUES(%s, %s, %s, %s, %s, %s, %s)
                   ON DUPLICATE KEY UPDATE
                   family_name = %s,
                   given_name = %s,
                   name_on_paper = %s,
                   alive = %s,
                   inspire_id = %s;""", data_tuple)
                   
        save_author_affiliations(paper_id, index, len(authors), 
                                 author[cfg.JSON.AFFILIATIONS])
                   
    # Delete old affiliations that are out of bounds - i.e. have a higher index 
    # than the length of the affiliations list
    run_sql("""DELETE FROM aulAUTHORS WHERE item >= %s AND paper_id = %s;""", 
            (len(authors), paper_id))
        
def save_author_affiliations(paper_id, author_id, number_of_authors, data):
    for index, affiliation in enumerate(data):
        data_tuple = (# insert values
                      index,
                      affiliation[cfg.JSON.AFFILIATION_ACRONYM],
                      affiliation[cfg.JSON.AFFILIATION_STATUS],
                      author_id,
                      paper_id,
        
                      # update values
                      affiliation[cfg.JSON.AFFILIATION_ACRONYM],
                      affiliation[cfg.JSON.AFFILIATION_STATUS])
                      
        run_sql("""INSERT INTO
                   aulAUTHOR_AFFILIATIONS (item, affiliation_acronym, 
                                           affiliation_status, author_item, 
                                           paper_id)
                   VALUES(%s, %s, %s, %s, %s)
                   ON DUPLICATE KEY UPDATE
                   affiliation_acronym = %s,
                   affiliation_status = %s;""", data_tuple)
    
    # Delete entries that the author does not have anymore               
    run_sql("""DELETE FROM aulAUTHOR_AFFILIATIONS WHERE item >= %s 
               AND author_item = %s AND paper_id = %s;""", 
            (len(data), author_id, paper_id))
            
    # Delete entries of non existing author
    run_sql("""DELETE FROM aulAUTHOR_AFFILIATIONS WHERE author_item >= %s 
                AND paper_id = %s;""",
            (number_of_authors, paper_id))
