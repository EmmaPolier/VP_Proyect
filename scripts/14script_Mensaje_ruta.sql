--Script para crear la tabla de mensajes de ruta y su índice.
--Este proposito es permitir que los pasajeros y conductores puedan 
-----enviar mensajes relacionados con una ruta específica, facilitando la comunicación entre ellos.
CREATE TABLE MENSAJE_RUTA (
    ID_MSG             NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ID_RUT_MSG         NUMBER NOT NULL,
    DOCUMENTO_USU_MSG  VARCHAR2(20) NOT NULL,   
    CONTENIDO_MSG      VARCHAR2(1000) NOT NULL,
    FECHA_ENVIO_MSG    TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
    CONSTRAINT FK_MSG_RUTA FOREIGN KEY (ID_RUT_MSG) REFERENCES RUTA(ID_RUT),
    CONSTRAINT FK_MSG_USU  FOREIGN KEY (DOCUMENTO_USU_MSG) REFERENCES USUARIO(DOCUMENTO_USU)
);

CREATE INDEX IDX_MSG_RUTA_FECHA ON MENSAJE_RUTA (ID_RUT_MSG, FECHA_ENVIO_MSG);