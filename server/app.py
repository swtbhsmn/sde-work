from sanic import Sanic, response
from sanic.request import Request
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Query, Session
from sqlalchemy.exc import SQLAlchemyError
import json
from sanic_cors import CORS
from urllib.parse import urlencode

DATABASE_URI = "sqlite:///students.db"

Base = declarative_base()


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True)
    name = Column(String(255))
    total_marks = Column(Integer)
    roll_no = Column(String)


app = Sanic(__name__)
CORS(app)
engine = create_engine(DATABASE_URI)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def paginate_students(
    session: Session, page_number: int, page_size: int
) -> list[Student]:
    """
    Retrieves a paginated list of students from the provided query.

    Args:
        session (Session): The database session object.
        page_number (int): The requested page number.
        page_size (int): The desired number of students per page.

    Returns:
        list[Student]: A list of Student objects for the specified page.
    """

    offset = (page_number - 1) * page_size
    students = session.query(Student).offset(offset).limit(page_size + 1).all()
    return students


def get_students_query(session: Session, request: Request) -> Query:
    """
    Query based on the provided filters.

    Args:
        session (Session): The database session object.
        request (Request): The incoming Sanic request object.

    Returns:
        Query: A SQLAlchemy query object with applied filters.
    """

    query = session.query(Student)
    try:
        if "name" in request.args:
            query = query.filter(Student.name.like(f"%{request.args['name'][0]}%"))
        if "total_marks" in request.args:
            if "cp" in request.args:
                comparison = request.args.get("cp")
                if comparison == "eq":
                    query = query.filter(
                        Student.total_marks == int(request.args["total_marks"][0])
                    )
                elif comparison == "neq":
                    query = query.filter(
                        Student.total_marks != int(request.args["total_marks"][0])
                    )
                elif comparison == "gt":
                    query = query.filter(
                        Student.total_marks > int(request.args["total_marks"][0])
                    )
                elif comparison == "lt":
                    query = query.filter(
                        Student.total_marks < int(request.args["total_marks"][0])
                    )
            else:
                query = query.filter(
                    Student.total_marks == int(request.args["total_marks"][0])
                )
        if "roll_no" in request.args:
            query = query.filter(
                Student.roll_no.like(f"%{request.args['roll_no'][0]}%")
            )
    except Exception as e:
        print(e)
    return query


@app.get("/students")
async def get_students(request: Request):
    """
    Retrieves student details with pagination.

    Args:
        request (Request): The incoming Sanic request object.

    Returns:
        JSON: A JSON response containing student data and pagination information.
    """
    try:
        page_number = int(request.args.get("page", 1))
        page_size = int(request.args.get("size", 10))

        with SessionLocal() as session:
            students = paginate_students(session, page_number, page_size)

        has_next = len(students) > page_size
        students = students[:page_size]

        student_list = [
            {
                "id": student.id,
                "name": student.name,
                "total_marks": student.total_marks,
                "roll_no": student.roll_no,
                
            }
            for student in students
        ]

    except SQLAlchemyError as e:
        print(f"An error occurred: {e}")
        return response.json({"error": "Internal server error"}, status=500)

    response_data = {
        "data": student_list,
        "total": len(student_list),
        "page": page_number,
        "size": page_size,
        "count":session.query(Student).count()
    }
    if has_next:
        next_page = page_number + 1
        query_params = {"page": next_page, "size": page_size}
        next_url = f"/students?{urlencode(query_params)}"
        response_data["next"] = next_url

    return response.json(response_data, status=200)


@app.get("/students/filter")
async def filter_students(request: Request):
    """
    Performs server-side filtering of student data based on query string parameters.

    Args:
        request (Request): The incoming Sanic request object.

    Returns:
        JSON: A JSON response containing filtered student data.
    """

    page_number = int(request.args.get("page", 1))
    page_size = int(request.args.get("size", 10))
    results = []
    try:

        with SessionLocal() as session:
            filtered_students = (
                get_students_query(session, request)
                .offset((page_number - 1) * page_size)
                .limit(page_size)
                .all()
            )

        for student in filtered_students:
            results.append(
                {
                    "id": student.id,
                    "name": student.name,
                    "total_marks": student.total_marks,
                    "roll_no": student.roll_no,
                }
            )

    except SQLAlchemyError as e:
        print(f"An error occurred: {e}")
        return response.json({"error": "Internal server error"}, status=500)

    return response.json(
        {
            "data": results,
            "total": len(results),
            "page": page_number,
            "size": page_size,
        },
        status=200,
    )


def load_json_file_data_to_db() -> None:
    try:
        with open("students.json", "r") as file:
            student_data = json.load(file)

        with SessionLocal() as session:
            for student in student_data["students"]:
                new_student = Student(
                    id=student["id"],
                    name=student["name"],
                    total_marks=student["total_marks"],
                    roll_no=student["roll_no"],
                )
                session.add(new_student)
            session.commit()
            session.close()
    except Exception as e:
        print(e)


if __name__ == "__main__":
    Base.metadata.create_all(engine)
    # load_json_file_data_to_db()
    app.run(host="0.0.0.0", port=8000, dev=True)
