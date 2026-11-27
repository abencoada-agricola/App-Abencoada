package br.com.abencoada.diesel;
import static org.junit.Assert.*;
import org.junit.Test;

public class ApiV1ErrorsTest {
 @Test public void conflictsAndUnknownFailuresStayInPortuguese(){
  assertTrue(ApiV1Errors.message(409,"READING_CONFLICT").contains("leituras"));
  assertTrue(ApiV1Errors.message(409,"FUTURE_ERROR").contains("conflito"));
  assertTrue(ApiV1Errors.message(503,"FUTURE_ERROR").contains("indisponível"));
  assertTrue(ApiV1Errors.message(0,"NETWORK_ERROR").contains("salvos no aparelho"));
  assertTrue(ApiV1Errors.message(400,null).startsWith("Não foi possível"));
 }
}
