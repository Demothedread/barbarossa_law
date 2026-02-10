"""Utility modules for the Law Quizzer backend."""

from .database import (DB_PATH, USE_POSTGRES, convert_query, get_db_connection,
                       get_db_path_as_path, get_placeholder, get_row_value,
                       get_scalar, normalize_question_for_api, row_to_dict)

__all__ = [
    'DB_PATH',
    'USE_POSTGRES',
    'convert_query',
    'get_db_connection',
    'get_db_path_as_path',
    'get_placeholder',
    'get_row_value',
    'get_scalar',
    'normalize_question_for_api',
    'row_to_dict',
]
