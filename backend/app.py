from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Configuración de la base de datos SQLite
# Ruta absoluta al archivo de la base de datos
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
DATABASE_PATH = os.path.join(BASE_DIR, 'gastos.db')

app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{DATABASE_PATH}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False # Para deshabilitar advertencias de eventos

db = SQLAlchemy(app)

# Definición del Modelo de Datos (POO) para Gasto
class Gasto(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    descripcion = db.Column(db.String(200), nullable=False)
    monto = db.Column(db.Float, nullable=False)
    fecha = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    categoria = db.Column(db.String(50), nullable=False)
    pagado = db.Column(db.Boolean, default=False) # Para marcar si está pagado/conciliado

    def __repr__(self):
        return f'<Gasto {self.id}: {self.descripcion} - {self.monto}>'

    # Método para convertir el objeto Gasto en un diccionario (útil para jsonify)
    def to_dict(self):
        return {
            'id': self.id,
            'descripcion': self.descripcion,
            'monto': self.monto,
            'fecha': self.fecha.isoformat(), # Convertir fecha a string ISO 8601
            'categoria': self.categoria,
            'pagado': self.pagado
        }

@app.route('/')
def home():
    return "¡Bienvenido al Backend de Control de Gastos!"

if __name__ == '__main__':
    # Asegúrate de que la base de datos se cree si no existe
    with app.app_context():
        db.create_all()
        print(f"Base de datos creada en: {DATABASE_PATH}")

    app.run(debug=True)